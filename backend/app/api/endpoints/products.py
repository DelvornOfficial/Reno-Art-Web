from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.core.ws import manager
from app.models.models import Product, OrderItem, MediaGallery
from app.schemas.schemas import ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["Products Catalog"])

@router.get("/", response_model=List[ProductOut])
async def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title/keyword"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).where(Product.is_published == True)
    
    if category and category != "All Designs":
        query = query.where(Product.category == category)
        
    if search:
        query = query.where(Product.title.ilike(f"%{search}%"))
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()

    # Get purchase counts per product
    counts_res = await db.execute(
        select(OrderItem.product_id, func.count(OrderItem.id)).group_by(OrderItem.product_id)
    )
    counts_map = dict(counts_res.fetchall())

    out_list = []
    for p in products:
        p_dict = {
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "format": p.format,
            "price": p.price,
            "original_price": p.original_price,
            "badge": p.badge,
            "poly_count": p.poly_count,
            "description": p.description,
            "image_url": p.image_url,
            "gallery_images": p.gallery_images or [],
            "gradient": p.gradient,
            "file_download_url": p.file_download_url,
            "pdf_document_url": p.pdf_document_url,
            "document_name": p.document_name,
            "mesh_topology": p.mesh_topology,
            "machine_compatibility": p.machine_compatibility,
            "supported_cam": p.supported_cam,
            "commercial_license": p.commercial_license,
            "custom_specs": p.custom_specs or [],
            "purchases_count": counts_map.get(p.id, 0),
            "is_published": p.is_published
        }
        out_list.append(ProductOut(**p_dict))
    return out_list

@router.get("/{product_id}", response_model=ProductOut)
async def get_product_detail(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    count_res = await db.execute(
        select(func.count(OrderItem.id)).where(OrderItem.product_id == product_id)
    )
    purchases_count = count_res.scalar() or 0

    p_dict = {
        "id": product.id,
        "title": product.title,
        "category": product.category,
        "format": product.format,
        "price": product.price,
        "original_price": product.original_price,
        "badge": product.badge,
        "poly_count": product.poly_count,
        "description": product.description,
        "image_url": product.image_url,
        "gallery_images": product.gallery_images or [],
        "gradient": product.gradient,
        "file_download_url": product.file_download_url,
        "mesh_topology": product.mesh_topology,
        "machine_compatibility": product.machine_compatibility,
        "supported_cam": product.supported_cam,
        "commercial_license": product.commercial_license,
        "custom_specs": product.custom_specs or [],
        "purchases_count": purchases_count,
        "is_published": product.is_published
    }
    return ProductOut(**p_dict)

@router.post("/", response_model=ProductOut)
async def create_new_product(
    prod_in: ProductOut,
    db: AsyncSession = Depends(get_db)
):
    """Add new 3D pattern from CRM directly into PostgreSQL database"""
    new_product = Product(
        id=prod_in.id,
        title=prod_in.title,
        category=prod_in.category,
        format=prod_in.format or "OBJ / STL / DWG",
        price=prod_in.price,
        original_price=prod_in.original_price or (prod_in.price * 2),
        badge=prod_in.badge or "New",
        poly_count=prod_in.poly_count or "High-Poly",
        description=prod_in.description or f"Architectural CAD toolpath for {prod_in.title}",
        image_url=prod_in.image_url,
        gallery_images=prod_in.gallery_images or [],
        gradient=prod_in.gradient or "linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)",
        file_download_url=prod_in.file_download_url,
        pdf_document_url=prod_in.pdf_document_url,
        document_name=prod_in.document_name,
        mesh_topology=prod_in.mesh_topology or "Closed Manifold / Slicer Optimized",
        machine_compatibility=prod_in.machine_compatibility or "3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser",
        supported_cam=prod_in.supported_cam or "ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD",
        commercial_license=prod_in.commercial_license or "Unlimited Physical Fabrication - Royalty-Free",
        custom_specs=prod_in.custom_specs or [],
        is_published=True
    )
    db.add(new_product)

    # Automatically archive uploaded product images & description renders in MediaGallery
    try:
        if new_product.image_url and new_product.image_url.strip():
            db.add(MediaGallery(
                title=f"{new_product.title} - Main Image",
                url=new_product.image_url,
                media_type="product_image"
            ))
        if new_product.gallery_images and isinstance(new_product.gallery_images, list):
            for idx, g_img in enumerate(new_product.gallery_images):
                if g_img and g_img.strip():
                    db.add(MediaGallery(
                        title=f"{new_product.title} - Description Render #{idx+1}",
                        url=g_img,
                        media_type="description_image"
                    ))
    except Exception:
        pass

    await db.commit()
    await db.refresh(new_product)

    # Broadcast realtime event to all connected clients
    await manager.broadcast({
        "event": "PRODUCT_CREATED",
        "product": {
            "id": new_product.id,
            "title": new_product.title,
            "category": new_product.category,
            "format": new_product.format,
            "price": new_product.price,
            "original_price": new_product.original_price,
            "badge": new_product.badge,
            "poly_count": new_product.poly_count,
            "description": new_product.description,
            "image_url": new_product.image_url,
            "gallery_images": new_product.gallery_images,
            "gradient": new_product.gradient,
            "file_download_url": new_product.file_download_url,
            "pdf_document_url": new_product.pdf_document_url,
            "document_name": new_product.document_name,
            "mesh_topology": new_product.mesh_topology,
            "machine_compatibility": new_product.machine_compatibility,
            "supported_cam": new_product.supported_cam,
            "commercial_license": new_product.commercial_license,
            "custom_specs": new_product.custom_specs,
            "purchases_count": 0,
            "is_published": True
        }
    })
    return new_product

@router.put("/{product_id}", response_model=ProductOut)
async def update_existing_product(
    product_id: str,
    prod_update: ProductUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Edit existing product details & specs in PostgreSQL and broadcast realtime update"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = prod_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    # Automatically archive updated images into Central Media Gallery
    try:
        if "image_url" in update_data and update_data["image_url"]:
            db.add(MediaGallery(
                title=f"{product.title} - Main Image (Updated)",
                url=update_data["image_url"],
                media_type="product_image"
            ))
        if "gallery_images" in update_data and isinstance(update_data["gallery_images"], list):
            for idx, g_img in enumerate(update_data["gallery_images"]):
                if g_img and g_img.strip():
                    db.add(MediaGallery(
                        title=f"{product.title} - Description Render #{idx+1}",
                        url=g_img,
                        media_type="description_image"
                    ))
    except Exception:
        pass

    await db.commit()
    await db.refresh(product)

    count_res = await db.execute(
        select(func.count(OrderItem.id)).where(OrderItem.product_id == product_id)
    )
    purchases_count = count_res.scalar() or 0

    # Broadcast realtime update to CRM & Storefront
    await manager.broadcast({
        "event": "PRODUCT_UPDATED",
        "product": {
            "id": product.id,
            "title": product.title,
            "category": product.category,
            "format": product.format,
            "price": product.price,
            "original_price": product.original_price,
            "badge": product.badge,
            "poly_count": product.poly_count,
            "description": product.description,
            "image_url": product.image_url,
            "gallery_images": product.gallery_images or [],
            "gradient": product.gradient,
            "file_download_url": product.file_download_url,
            "pdf_document_url": product.pdf_document_url,
            "document_name": product.document_name,
            "mesh_topology": product.mesh_topology,
            "machine_compatibility": product.machine_compatibility,
            "supported_cam": product.supported_cam,
            "commercial_license": product.commercial_license,
            "custom_specs": product.custom_specs,
            "purchases_count": purchases_count,
            "is_published": product.is_published
        }
    })
    return product

@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Delete pattern from PostgreSQL and broadcast live update safely without breaking historical orders"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    from app.models.models import OrderItem, Review, PurchasedProduct
    from sqlalchemy import update, delete

    # 1. Nullify references in order_items and purchased_products so historical sales records & invoices are kept safe
    await db.execute(update(OrderItem).where(OrderItem.product_id == product_id).values(product_id=None))
    await db.execute(update(PurchasedProduct).where(PurchasedProduct.product_id == product_id).values(product_id=None))
    # 2. Delete reviews associated with this product
    await db.execute(delete(Review).where(Review.product_id == product_id))

    await db.delete(product)
    await db.commit()

    # Broadcast realtime delete event to all connected clients
    await manager.broadcast({
        "event": "PRODUCT_DELETED",
        "product_id": product_id
    })
    return {"success": True, "deleted_id": product_id}
