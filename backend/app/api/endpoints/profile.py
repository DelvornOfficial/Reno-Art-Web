from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.models import User, PurchasedProduct, Product, MediaGallery
from app.schemas.schemas import PurchasedProductOut

router = APIRouter(prefix="/profile", tags=["User Profile & Purchases"])

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    profile_image: Optional[str] = None
    phone: Optional[str] = None

@router.get("/purchases", response_model=List[PurchasedProductOut])
async def get_my_purchases(
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    target_user_id = None
    target_email = email

    if current_user:
        target_user_id = current_user.id
        target_email = current_user.email
    elif user_id:
        try:
            target_user_id = int(user_id)
        except ValueError:
            target_email = user_id

    # If we have an email but no user_id, lookup user by email or orders
    if not target_user_id and target_email:
        u_res = await db.execute(select(User).where((User.email == target_email) | (User.username == target_email)))
        u = u_res.scalars().first()
        if u:
            target_user_id = u.id

    if not target_user_id and not target_email:
        return []

    conditions = [(PurchasedProduct.is_revoked == False) | (PurchasedProduct.is_revoked == None)]
    if target_user_id:
        conditions.append(PurchasedProduct.user_id == target_user_id)
    elif target_email:
        from app.models.models import Order
        user_orders = await db.execute(select(Order.id).where(Order.user_email == target_email))
        order_ids = user_orders.scalars().all()
        if order_ids:
            conditions.append(PurchasedProduct.order_id.in_(order_ids))
        else:
            return []

    from app.models.models import Order
    query = (
        select(PurchasedProduct, Product, Order)
        .outerjoin(Product, PurchasedProduct.product_id == Product.id)
        .outerjoin(Order, PurchasedProduct.order_id == Order.id)
        .where(*conditions)
        .order_by(PurchasedProduct.purchased_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    purchases = []
    for pur, prod, ord_obj in rows:
        title = (prod.title if prod else None) or pur.title or "Architectural CAD Asset"
        fmt = (prod.format if prod else None) or pur.format or "OBJ / STL / DWG"
        cat = (prod.category if prod else None) or pur.category or "3D Models"
        file_dl_url = (prod.file_download_url if prod else None) or pur.file_download_url
        pdf_url = (prod.pdf_document_url if prod else None) or pur.pdf_document_url
        doc_name = (prod.document_name if prod else None) or pur.document_name
        img_url = (prod.image_url if prod else None) or pur.image_url
        gradient = (prod.gradient if prod else None) or pur.gradient
        desc = (prod.description if prod else None) or "Precision CAD 3D model verified for manufacturing and stone routing."

        price_paid = float(ord_obj.amount) if ord_obj and ord_obj.amount else (float(prod.price) if prod and prod.price else 0.0)
        order_num = ord_obj.order_number if ord_obj else f"RENO-ORD-{pur.id:06d}"
        invoice_num = f"INV-{order_num.replace('RENO-', '')}"

        purchases.append(PurchasedProductOut(
            id=pur.id,
            product_id=pur.product_id or (prod.id if prod else None),
            title=title,
            format=fmt,
            category=cat,
            license_key=pur.license_key,
            file_download_url=file_dl_url,
            download_url=file_dl_url or f"/api/v1/profile/download/{pur.license_key}",
            pdf_document_url=pdf_url,
            document_name=doc_name,
            image_url=img_url,
            gradient=gradient,
            purchased_at=pur.purchased_at,
            price_paid=price_paid,
            order_number=order_num,
            invoice_number=invoice_num,
            payment_method="Razorpay / UPI",
            description=desc
        ))
    return purchases

@router.get("/download/{license_key}")
async def get_download_link(
    license_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PurchasedProduct, Product)
        .outerjoin(Product, PurchasedProduct.product_id == Product.id)
        .where(PurchasedProduct.license_key == license_key, PurchasedProduct.user_id == current_user.id)
    )
    row = result.first()
    if not row:
        return {"error": "Invalid or unauthorized license key"}
    
    pur, prod = row
    title = (prod.title if prod else None) or pur.title or "Architectural CAD Asset"
    fmt = (prod.format if prod else None) or pur.format or "OBJ / STL / DWG"
    cad_url = (prod.file_download_url if prod else None) or pur.file_download_url or f"https://cdn.renoart.in/files/{pur.product_id or pur.license_key}-cad-package.zip"
    
    return {
        "status": "ready",
        "product": title,
        "format": fmt,
        "license": pur.license_key,
        "cad_package_url": cad_url,
        "pdf_document_url": (prod.pdf_document_url if prod else None) or pur.pdf_document_url,
        "document_name": (prod.document_name if prod else None) or pur.document_name
    }

@router.put("/update")
async def update_user_profile(
    req: UpdateProfileRequest,
    email: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Allow user to update display name, profile photo and phone"""
    user = current_user
    if not user and email:
        res = await db.execute(select(User).where((User.email == email) | (User.username == email)))
        user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="User account not found")

    if req.name is not None and req.name.strip():
        user.name = req.name.strip()
    if req.profile_image is not None:
        user.profile_image = req.profile_image
        if req.profile_image.strip():
            # Automatically archive uploaded avatar in Central Media Gallery
            try:
                gallery_entry = MediaGallery(
                    title=f"Profile Avatar - {user.name or user.username or user.email}",
                    url=req.profile_image,
                    media_type="user_profile"
                )
                db.add(gallery_entry)
            except Exception:
                pass
    if req.phone is not None:
        user.phone = req.phone.strip()

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "name": user.name,
        "profile_image": user.profile_image,
        "phone": user.phone,
        "email": user.email,
        "username": user.username,
        "plan": user.plan.value if hasattr(user.plan, "value") else str(user.plan)
    }
