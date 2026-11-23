from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import User, UserActivity, Order, PurchasedProduct
from app.schemas.schemas import (
    CustomerDetailOut, 
    ActivityPing, 
    CustomerDetailedAnalytics, 
    CustomerPurchaseHistoryItem,
    RevokePurchaseRequest,
    SendCustomerEmailRequest
)

router = APIRouter(prefix="/customers", tags=["CRM Customer Management & Analytics"])

@router.get("/", response_model=List[CustomerDetailOut])
async def list_customers(
    db: AsyncSession = Depends(get_db)
):
    """List all registered customers with real-time carts, activity and membership stats for CRM"""
    users_res = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_res.scalars().all()

    output = []
    for u in users:
        # Get user activity
        act_res = await db.execute(
            select(UserActivity).where(UserActivity.user_id == u.id).order_by(UserActivity.last_active.desc())
        )
        act = act_res.scalars().first()

        # Orders count (by user_id or matching email)
        ord_res = await db.execute(
            select(func.count(Order.id)).where((Order.user_id == u.id) | (Order.user_email == u.email))
        )
        orders_count = ord_res.scalar() or 0

        # Purchased products count (by user_id or matching order email)
        pur_res = await db.execute(
            select(func.count(PurchasedProduct.id)).where(PurchasedProduct.user_id == u.id)
        )
        purchases_count = pur_res.scalar() or 0

        output.append(CustomerDetailOut(
            id=u.id,
            name=u.name,
            username=u.username,
            email=u.email,
            profile_image=u.profile_image or "",
            plan=u.plan.value if hasattr(u.plan, 'value') else str(u.plan),
            role=u.role.value if hasattr(u.role, 'value') else str(u.role),
            created_at=u.created_at,
            cart_items_count=act.cart_items_count if act else 0,
            cart_product_ids=act.cart_product_ids if act else "",
            current_page=act.current_page if act else "Home",
            current_product_id=act.current_product_id if act else "",
            current_product_title=act.current_product_title if act else "",
            time_spent_seconds=act.time_spent_seconds if act else 0,
            page_dwell_times=act.page_dwell_times if (act and act.page_dwell_times) else {},
            funnel_stage=act.funnel_stage if (act and act.funnel_stage) else "Browsing",
            cart_dropoffs=act.cart_dropoffs if (act and act.cart_dropoffs) else [],
            last_active=act.last_active if act else u.created_at,
            orders_count=orders_count,
            purchases_count=purchases_count
        ))
    return output

@router.get("/{user_id}/analytics", response_model=CustomerDetailedAnalytics)
async def get_customer_detailed_analytics(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full analytics suite for a specific customer (Dwell times, Cart Funnel, Purchases, Spend)"""
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    act_res = await db.execute(select(UserActivity).where(UserActivity.user_id == user_id))
    act = act_res.scalars().first()

    # Purchased products
    purchases_res = await db.execute(
        select(PurchasedProduct).where(
            (PurchasedProduct.user_id == user_id) |
            (PurchasedProduct.user_id == None) & (PurchasedProduct.order_id.in_(
                select(Order.id).where(Order.user_email == user.email)
            ))
        ).order_by(PurchasedProduct.purchased_at.desc())
    )
    purchases = purchases_res.scalars().all()

    # Total spent & orders (by user_id OR user_email)
    orders_res = await db.execute(
        select(Order).where((Order.user_id == user_id) | (Order.user_email == user.email))
    )
    orders = orders_res.scalars().all()
    # Count all paid / completed orders including digital CAD products and subscription plans
    total_spent = sum([float(o.amount or 0) for o in orders if str(o.status).lower() in ["completed", "paid", "orderstatus.paid", "orderstatus.completed"]])

    # If user has an active/assigned subscription tier but no separate Order row was logged yet (or purchased before update),
    # ensure tier price is credited into total_spent so lifetime spend accurately reflects membership investment!
    if (user.plan.value if hasattr(user.plan, 'value') else str(user.plan)) == "premium" or user.subscription_tier_id:
        has_sub_order = any(o.order_number and "RENO-SUB" in o.order_number for o in orders)
        if not has_sub_order:
            # Map tier price
            tier_price_map = {
                "tier_1": 299.0,
                "tier_2": 699.0,
                "tier_3": 1499.0
            }
            sub_val = tier_price_map.get(user.subscription_tier_id, 699.0)
            total_spent += sub_val

    return CustomerDetailedAnalytics(
        user_id=user.id,
        name=user.name,
        email=user.email,
        username=user.username,
        plan=user.plan.value if hasattr(user.plan, 'value') else str(user.plan),
        subscription_tier_id=user.subscription_tier_id,
        subscription_expires_at=user.subscription_expires_at,
        subscription_started_at=user.subscription_started_at,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role),
        created_at=user.created_at,
        last_active=act.last_active if act else user.created_at,
        total_time_spent_seconds=act.time_spent_seconds if act else 0,
        current_page=act.current_page if act else "Home",
        current_product_title=act.current_product_title if act else "",
        cart_items_count=act.cart_items_count if act else 0,
        page_dwell_times=act.page_dwell_times if (act and act.page_dwell_times) else {},
        funnel_stage=act.funnel_stage if (act and act.funnel_stage) else "Browsing",
        cart_dropoffs=act.cart_dropoffs if (act and act.cart_dropoffs) else [],
        purchased_products=[CustomerPurchaseHistoryItem.model_validate(p) for p in purchases],
        total_spent=total_spent,
        orders_count=len(orders)
    )

@router.delete("/{user_id}/purchase/{purchase_id}")
async def delete_customer_purchase(
    user_id: int,
    purchase_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Permanently delete a purchased product record for a customer"""
    pur_res = await db.execute(
        select(PurchasedProduct).where(
            PurchasedProduct.id == purchase_id,
            PurchasedProduct.user_id == user_id
        )
    )
    item = pur_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Purchased product record not found.")

    product_title = item.title
    await db.delete(item)
    await db.commit()
    return {"status": "success", "message": f"Purchased product '{product_title}' has been completely removed."}

@router.post("/{user_id}/revoke-purchase")
async def revoke_customer_purchase(
    user_id: int,
    revoke_data: RevokePurchaseRequest,
    db: AsyncSession = Depends(get_db)
):
    """Revoke or restore access to a customer's purchased product with mandatory reason"""
    if not revoke_data.reason or not revoke_data.reason.strip():
        raise HTTPException(status_code=400, detail="Revocation reason is required to revoke access.")

    pur_res = await db.execute(
        select(PurchasedProduct).where(
            PurchasedProduct.id == revoke_data.purchased_product_id,
            PurchasedProduct.user_id == user_id
        )
    )
    item = pur_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Purchased product record not found for this user.")

    # Toggle revocation or mark as revoked
    item.is_revoked = True
    item.revocation_reason = revoke_data.reason.strip()
    item.revoked_at = datetime.utcnow()
    await db.commit()

    return {
        "status": "success",
        "message": f"Product '{item.title}' has been revoked successfully.",
        "purchased_product_id": item.id,
        "is_revoked": item.is_revoked,
        "revocation_reason": item.revocation_reason
    }

@router.post("/{user_id}/restore-purchase")
async def restore_customer_purchase(
    user_id: int,
    item_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Restore access to a previously revoked purchased product"""
    pur_res = await db.execute(
        select(PurchasedProduct).where(
            PurchasedProduct.id == item_id,
            PurchasedProduct.user_id == user_id
        )
    )
    item = pur_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Purchased product record not found.")

    item.is_revoked = False
    item.revocation_reason = None
    item.revoked_at = None
    await db.commit()
    return {"status": "success", "message": f"Product access for '{item.title}' has been restored."}

@router.post("/{user_id}/send-email")
async def send_customer_email(
    user_id: int,
    email_data: SendCustomerEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    """Directly send notification / email message to customer from Admin CRM"""
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not email_data.subject.strip() or not email_data.message.strip():
        raise HTTPException(status_code=400, detail="Subject and message cannot be empty.")

    # In production, this can invoke SendGrid / SMTP / SES. We log it and record success dispatch.
    print(f"[CRM EMAIL DISPATCH] To: {user.email} ({user.name}) | Subject: {email_data.subject}")
    print(f"[CRM EMAIL BODY]:\n{email_data.message}\n")

    return {
        "status": "sent",
        "recipient": user.email,
        "recipient_name": user.name or user.username,
        "subject": email_data.subject,
        "sent_at": datetime.utcnow().isoformat()
    }

@router.post("/activity/ping")
async def ping_customer_activity(
    ping: ActivityPing,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Frontend sends heartbeat to track which page/product user is viewing, page dwell times, & funnel stage"""
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    act_res = await db.execute(select(UserActivity).where(UserActivity.user_id == user_id))
    act = act_res.scalars().first()
    now = datetime.utcnow()

    if not act:
        act = UserActivity(
            user_id=user_id,
            user_email=user.email,
            cart_items_count=ping.cart_items_count or 0,
            cart_product_ids=ping.cart_product_ids or "",
            current_page=ping.current_page or "Home",
            current_product_id=ping.current_product_id or "",
            current_product_title=ping.current_product_title or "",
            time_spent_seconds=ping.time_spent_seconds or 0,
            page_dwell_times=ping.page_dwell_times or {},
            funnel_stage=ping.funnel_stage or "Browsing",
            cart_dropoffs=[ping.cart_dropoff_event] if ping.cart_dropoff_event else [],
            last_active=now
        )
        db.add(act)
    else:
        act.cart_items_count = ping.cart_items_count if ping.cart_items_count is not None else act.cart_items_count
        act.cart_product_ids = ping.cart_product_ids if ping.cart_product_ids is not None else act.cart_product_ids
        act.current_page = ping.current_page or act.current_page
        act.current_product_id = ping.current_product_id or act.current_product_id
        act.current_product_title = ping.current_product_title or act.current_product_title
        if ping.time_spent_seconds:
            act.time_spent_seconds += ping.time_spent_seconds
        
        # Merge page dwell times
        if ping.page_dwell_times:
            current_dwells = dict(act.page_dwell_times or {})
            for page, secs in ping.page_dwell_times.items():
                current_dwells[page] = current_dwells.get(page, 0) + secs
            act.page_dwell_times = current_dwells

        if ping.funnel_stage:
            act.funnel_stage = ping.funnel_stage

        if ping.cart_dropoff_event:
            dropoffs = list(act.cart_dropoffs or [])
            dropoffs.insert(0, {**ping.cart_dropoff_event, "timestamp": now.isoformat()})
            act.cart_dropoffs = dropoffs[:20] # keep last 20 events

        act.last_active = now

    await db.commit()
    return {"status": "ok", "last_active": now.isoformat()}


class TogglePlanRequest(BaseModel):
    plan: str # 'normal' | 'premium' | 'blocked'
    tier_id: Optional[str] = 'tier_2'
    duration_days: Optional[int] = 30
    action: Optional[str] = 'update' # 'assign' | 'block' | 'delete'

@router.post("/{user_id}/toggle-plan")
async def toggle_customer_plan(
    user_id: int,
    req: TogglePlanRequest,
    db: AsyncSession = Depends(get_db)
):
    """Admin control to assign, block, or delete customer VIP premium subscription"""
    from app.models.models import MembershipPlan
    from datetime import datetime, timedelta

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    if req.action == "delete" or req.plan == "normal":
        user.plan = MembershipPlan.NORMAL
        user.subscription_tier_id = None
        user.subscription_started_at = None
        user.subscription_expires_at = None
    elif req.action == "block" or req.plan == "blocked":
        # Block / freeze membership access immediately
        user.plan = MembershipPlan.NORMAL
        user.subscription_tier_id = "blocked"
        user.subscription_expires_at = datetime.utcnow() # Expired immediately
    else:
        # Assign / Activate VIP
        user.plan = MembershipPlan.PREMIUM
        user.subscription_tier_id = req.tier_id or "tier_2"
        user.subscription_started_at = datetime.utcnow()
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=req.duration_days or 30)

        # Also create an official Order log for this assigned subscription if not already logged
        try:
            import uuid
            from app.models.models import OrderStatus
            tier_price_map = {"tier_1": 299.0, "tier_2": 699.0, "tier_3": 1499.0}
            sub_val = tier_price_map.get(user.subscription_tier_id, 699.0)
            db.add(Order(
                order_number=f"RENO-SUB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
                user_id=user.id,
                user_email=user.email,
                amount=sub_val,
                status=OrderStatus.PAID,
                paid_at=datetime.utcnow()
            ))
        except Exception:
            pass

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "user_id": user.id,
        "plan": user.plan.value if hasattr(user.plan, 'value') else str(user.plan),
        "subscription_tier_id": user.subscription_tier_id,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None
    }
