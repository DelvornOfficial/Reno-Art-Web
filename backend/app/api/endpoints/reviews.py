from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.ws import manager
from app.models.models import Review, PurchasedProduct, Product, User
from app.schemas.schemas import ReviewCreate, ReviewUpdate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Product Reviews"])

@router.get("/{product_id}", response_model=List[ReviewOut])
async def get_product_reviews(
    product_id: str,
    user_id: Optional[int] = Query(None, description="Check if requesting user can edit"),
    db: AsyncSession = Depends(get_db)
):
    """Fetch genuine customer reviews for a specific product"""
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    
    now = datetime.utcnow()
    output = []
    for r in reviews:
        # Can edit only within 24 hours of creation and if requesting user matches
        is_owner = (user_id is not None and r.user_id == user_id)
        within_24h = (now - r.created_at) < timedelta(hours=24)
        can_edit = is_owner and within_24h
        
        output.append(ReviewOut(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_name=r.user_name,
            user_email=r.user_email,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            updated_at=r.updated_at,
            can_edit=can_edit
        ))
    return output

@router.get("/eligibility/{product_id}")
async def check_review_eligibility(
    product_id: str,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a user is eligible to write or edit a review.
    Rule:
    1. User MUST have purchased the product (genuine buyers only, zero fake reviews).
    2. Check if user already reviewed.
    3. If reviewed, allow edit ONLY within 24 hours of creation, then lock permanently.
    """
    # 1. Check purchase
    purchase_res = await db.execute(
        select(PurchasedProduct).where(
            PurchasedProduct.user_id == user_id,
            PurchasedProduct.product_id == product_id
        )
    )
    has_purchased = purchase_res.scalars().first() is not None
    if not has_purchased:
        return {
            "eligible": False,
            "has_purchased": False,
            "message": "Only verified buyers of this design file can post reviews."
        }

    # 2. Check existing review
    review_res = await db.execute(
        select(Review).where(
            Review.user_id == user_id,
            Review.product_id == product_id
        )
    )
    existing_review = review_res.scalars().first()
    
    if not existing_review:
        return {
            "eligible": True,
            "has_purchased": True,
            "already_reviewed": False,
            "can_edit": True,
            "message": "Verified buyer: you can submit a review."
        }

    # Check 24 hour edit lock
    now = datetime.utcnow()
    hours_left = max(0.0, 24.0 - ((now - existing_review.created_at).total_seconds() / 3600.0))
    can_edit = (now - existing_review.created_at) < timedelta(hours=24)

    return {
        "eligible": True,
        "has_purchased": True,
        "already_reviewed": True,
        "can_edit": can_edit,
        "hours_left_to_edit": round(hours_left, 1),
        "existing_review": {
            "id": existing_review.id,
            "rating": existing_review.rating,
            "comment": existing_review.comment,
            "created_at": existing_review.created_at.isoformat()
        },
        "message": "Review editable within 24 hours" if can_edit else "Review locked after 24 hours limit"
    }

@router.post("/{product_id}", response_model=ReviewOut)
async def submit_review(
    product_id: str,
    review_in: ReviewCreate,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Submit a verified buyer review (text & 1-5 star ratings only)."""
    # Verify product exists
    p_res = await db.execute(select(Product).where(Product.id == product_id))
    product = p_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Verify user exists
    u_res = await db.execute(select(User).where(User.id == user_id))
    user = u_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify buyer purchased this product
    purchase_res = await db.execute(
        select(PurchasedProduct).where(
            PurchasedProduct.user_id == user_id,
            PurchasedProduct.product_id == product_id
        )
    )
    if not purchase_res.scalars().first():
        raise HTTPException(status_code=403, detail="Only verified customers who purchased this design can write a review.")

    # Validate rating
    if review_in.rating < 1 or review_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars.")

    if not review_in.comment.strip():
        raise HTTPException(status_code=400, detail="Review comment text is required.")

    # Check if already reviewed
    rev_res = await db.execute(
        select(Review).where(
            Review.user_id == user_id,
            Review.product_id == product_id
        )
    )
    existing = rev_res.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product. Use edit within 24 hours.")

    new_review = Review(
        product_id=product_id,
        user_id=user_id,
        user_name=user.name or user.username or "RENO Client",
        user_email=user.email,
        rating=review_in.rating,
        comment=review_in.comment.strip()
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    # Realtime broadcast
    await manager.broadcast({
        "event": "REVIEW_ADDED",
        "review": {
            "id": new_review.id,
            "product_id": new_review.product_id,
            "user_id": new_review.user_id,
            "user_name": new_review.user_name,
            "rating": new_review.rating,
            "comment": new_review.comment,
            "created_at": new_review.created_at.isoformat()
        }
    })

    return ReviewOut(
        id=new_review.id,
        product_id=new_review.product_id,
        user_id=new_review.user_id,
        user_name=new_review.user_name,
        user_email=new_review.user_email,
        rating=new_review.rating,
        comment=new_review.comment,
        created_at=new_review.created_at,
        updated_at=new_review.updated_at,
        can_edit=True
    )

@router.put("/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Edit review strictly within 24 hours of creation, permanently locked after 24h."""
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own review.")

    # 24 Hours lock check
    now = datetime.utcnow()
    if (now - review.created_at) > timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Review editing locked: 24-hour edit window has expired.")

    if review_update.rating is not None:
        if review_update.rating < 1 or review_update.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars.")
        review.rating = review_update.rating

    if review_update.comment is not None and review_update.comment.strip():
        review.comment = review_update.comment.strip()

    review.updated_at = now
    await db.commit()
    await db.refresh(review)

    # Realtime broadcast
    await manager.broadcast({
        "event": "REVIEW_UPDATED",
        "review": {
            "id": review.id,
            "product_id": review.product_id,
            "rating": review.rating,
            "comment": review.comment,
            "updated_at": review.updated_at.isoformat()
        }
    })

    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=review.user_name,
        user_email=review.user_email,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
        can_edit=True
    )
