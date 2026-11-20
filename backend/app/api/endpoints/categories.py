from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.ws import manager
from app.models.models import Category
from app.schemas.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Fetch all categories from PostgreSQL"""
    result = await db.execute(select(Category).order_by(Category.name.asc()))
    return result.scalars().all()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(cat_in: CategoryCreate, db: AsyncSession = Depends(get_db)):
    """Add a new category in PostgreSQL and broadcast to store/CRM"""
    name = cat_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty")
        
    result = await db.execute(select(Category).where(Category.name.ilike(name)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    slug = name.lower().replace(" ", "-")
    new_cat = Category(name=name, slug=slug)
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)

    # Real-time WebSocket broadcast (No reload)
    await manager.broadcast({
        "event": "CATEGORY_CREATED",
        "category": {
            "id": new_cat.id,
            "name": new_cat.name,
            "slug": new_cat.slug
        }
    })

    return new_cat

@router.delete("/{category_id}")
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    """Remove category from PostgreSQL and broadcast"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    cat = result.scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
        
    cat_name = cat.name
    await db.delete(cat)
    await db.commit()

    # Real-time WebSocket broadcast
    await manager.broadcast({
        "event": "CATEGORY_DELETED",
        "category_id": category_id,
        "name": cat_name
    })

    return {"success": True, "deleted_id": category_id, "name": cat_name}
