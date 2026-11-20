from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.api.deps import get_current_user, get_optional_user
from app.models.models import User, PurchasedProduct, Product
from app.schemas.schemas import PurchasedProductOut

router = APIRouter(prefix="/profile", tags=["User Profile & Purchases"])

@router.get("/purchases", response_model=List[PurchasedProductOut])
async def get_my_purchases(
    user_id: int | None = None,
    current_user: User = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    target_user_id = current_user.id if current_user else user_id
    if not target_user_id:
        return []

    query = (
        select(PurchasedProduct, Product)
        .outerjoin(Product, PurchasedProduct.product_id == Product.id)
        .where(
            PurchasedProduct.user_id == target_user_id,
            (PurchasedProduct.is_revoked == False) | (PurchasedProduct.is_revoked == None)
        )
        .order_by(PurchasedProduct.purchased_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    purchases = []
    for pur, prod in rows:
        title = (prod.title if prod else None) or pur.title or "Architectural CAD Asset"
        fmt = (prod.format if prod else None) or pur.format or "OBJ / STL / DWG"
        cat = (prod.category if prod else None) or pur.category or "3D Models"
        pdf_url = (prod.pdf_document_url if prod else None) or pur.pdf_document_url
        doc_name = (prod.document_name if prod else None) or pur.document_name
        img_url = (prod.image_url if prod else None) or pur.image_url
        gradient = (prod.gradient if prod else None) or pur.gradient

        purchases.append(PurchasedProductOut(
            id=pur.id,
            product_id=pur.product_id or (prod.id if prod else None),
            title=title,
            format=fmt,
            category=cat,
            license_key=pur.license_key,
            download_url=f"/api/v1/profile/download/{pur.license_key}",
            pdf_document_url=pdf_url,
            document_name=doc_name,
            image_url=img_url,
            gradient=gradient,
            purchased_at=pur.purchased_at
        ))
    return purchases

@router.get("/download/{license_key}")
async def get_download_link(
    license_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify ownership
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
