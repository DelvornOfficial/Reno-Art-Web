from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.models import MediaGallery
from app.schemas.schemas import MediaGalleryCreate, MediaGalleryOut

router = APIRouter(prefix="/gallery", tags=["Media Gallery"])

@router.get("/", response_model=List[MediaGalleryOut])
async def list_gallery_items(
    include_profiles: bool = True,
    media_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve media gallery items with filtering. By default includes all images (products, descriptions, user avatars)."""
    query = select(MediaGallery).order_by(MediaGallery.id.desc())
    if not include_profiles:
        query = query.where(MediaGallery.media_type != "user_profile")
    if media_type and media_type != "all":
        query = query.where(MediaGallery.media_type == media_type)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=MediaGalleryOut)
async def add_gallery_item(
    item_in: MediaGalleryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add new uploaded image to the centralized media gallery"""
    new_item = MediaGallery(
        title=item_in.title or "Uploaded Media",
        url=item_in.url,
        media_type=item_in.media_type or "product_image"
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

@router.delete("/{item_id}")
async def delete_gallery_item(
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete image from media gallery"""
    res = await db.execute(select(MediaGallery).where(MediaGallery.id == item_id))
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
        
    await db.delete(item)
    await db.commit()
    return {"success": True, "deleted_id": item_id}
