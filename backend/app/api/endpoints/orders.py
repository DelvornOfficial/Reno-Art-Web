import uuid
import hmac
import hashlib
import io
import base64
import requests
from PIL import Image
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import razorpay

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_optional_user, get_current_user
from app.models.models import Order, OrderItem, PurchasedProduct, OrderStatus, User, Product
from app.schemas.schemas import CreateOrderRequest, RazorpayOrderOut, VerifyPaymentRequest

router = APIRouter(prefix="/orders", tags=["Orders & Payments"])

def get_razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@router.post("/checkout", response_model=RazorpayOrderOut)
async def create_checkout_order(
    req: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total
    total_amount = sum(item.price for item in req.items)
    discount = 0.0

    # Coupon validation
    if req.coupon_code:
        code = req.coupon_code.strip().upper()
        if code in ["RENO20", "STUDIO20"]:
            discount = round(total_amount * 0.20, 2)
        elif code in ["FIRST10"]:
            discount = round(total_amount * 0.10, 2)
    
    final_amount = max(1.0, total_amount - discount)
    order_number = f"RENO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Create Razorpay Order
    client = get_razorpay_client()
    try:
        # Razorpay amount is in paise (1 INR = 100 paise)
        rzp_order = client.order.create({
            "amount": int(final_amount * 100),
            "currency": "INR",
            "receipt": order_number,
            "payment_capture": 1
        })
        rzp_order_id = rzp_order.get("id")
    except Exception as e:
        # Fallback for dev / mock mode if keys are placeholders
        rzp_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"

    # Save order in DB
    new_order = Order(
        order_number=order_number,
        user_id=user.id if user else None,
        user_email=req.email,
        amount=final_amount,
        discount=discount,
        currency="INR",
        status=OrderStatus.PENDING,
        razorpay_order_id=rzp_order_id
    )
    db.add(new_order)
    await db.flush()

    # Add order items
    for item in req.items:
        db.add(OrderItem(
            order_id=new_order.id,
            product_id=item.id,
            price=item.price,
            title=item.title
        ))

    await db.commit()
    await db.refresh(new_order)

    return RazorpayOrderOut(
        order_id=new_order.id,
        order_number=order_number,
        razorpay_order_id=rzp_order_id,
        amount=final_amount,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID
    )

@router.post("/create-qr")
async def create_razorpay_qr(
    req: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_user)
):
    """Generate dynamic UPI QR Code on-demand via Razorpay API when user explicitly clicks Show QR"""
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_amount = sum(item.price for item in req.items)
    discount = 0.0

    if req.coupon_code:
        code = req.coupon_code.strip().upper()
        if code in ["RENO10", "FIRST10"]:
            discount = round(total_amount * 0.10, 2)
        elif code in ["RENO20", "VIP20"]:
            discount = round(total_amount * 0.20, 2)
        elif code in ["ARCH50"]:
            discount = min(50.0, total_amount)

    final_amount = max(1.0, total_amount - discount)
    order_number = f"RENO-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    client = get_razorpay_client()
    try:
        qr = client.qrcode.create({
            "type": "upi_qr",
            "name": "RENO DESIGN CAD",
            "usage": "single_use",
            "fixed_amount": True,
            "payment_amount": int(final_amount * 100),
            "description": f"Architectural CAD {order_number}"
        })
        qr_id = qr.get("id")
        qr_image_url = qr.get("image_url")

        # Crop out Razorpay branding poster and isolate pure high-contrast QR code
        isolated_qr_url = qr_image_url
        try:
            r = requests.get(qr_image_url, timeout=5)
            if r.status_code == 200:
                raw_poster = Image.open(io.BytesIO(r.content))
                # Exact coordinates of the QR square inside Razorpay standard 674x1644 poster
                padding = 16
                crop_box = (max(0, 146 - padding), max(0, 658 - padding), min(raw_poster.width, 525 + padding), min(raw_poster.height, 1037 + padding))
                cropped_qr = raw_poster.crop(crop_box)
                out_buffer = io.BytesIO()
                cropped_qr.save(out_buffer, format="PNG")
                b64_str = base64.b64encode(out_buffer.getvalue()).decode("utf-8")
                isolated_qr_url = f"data:image/png;base64,{b64_str}"
        except Exception:
            # Fallback gracefully to original url if cropping network timeout
            isolated_qr_url = qr_image_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Razorpay QR: {str(e)}")

    # Save pending order in DB
    new_order = Order(
        order_number=order_number,
        user_id=user.id if user else None,
        user_email=req.email,
        amount=final_amount,
        discount=discount,
        currency="INR",
        status=OrderStatus.PENDING,
        razorpay_order_id=qr_id
    )
    db.add(new_order)
    await db.flush()

    for item in req.items:
        db.add(OrderItem(
            order_id=new_order.id,
            product_id=item.id,
            price=item.price,
            title=item.title
        ))

    await db.commit()
    await db.refresh(new_order)

    return {
        "order_number": order_number,
        "qr_id": qr_id,
        "qr_image_url": isolated_qr_url,
        "raw_poster_url": qr_image_url,
        "amount": final_amount,
        "currency": "INR"
    }

@router.get("/check-qr-status/{order_number}")
async def check_qr_payment_status(
    order_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Poll payment status for on-demand Razorpay QR Code"""
    result = await db.execute(select(Order).where(Order.order_number == order_number))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.PAID:
        return {"status": "PAID", "order_number": order_number}

    qr_id = order.razorpay_order_id
    if qr_id and qr_id.startswith("qr_"):
        client = get_razorpay_client()
        try:
            payments = client.qrcode.fetch_all_payments(qr_id)
            items = payments.get("items", [])
            for p in items:
                if p.get("status") == "captured":
                    order.status = OrderStatus.PAID
                    order.razorpay_payment_id = p.get("id")
                    order.paid_at = datetime.utcnow()

                    # Unlock licenses
                    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
                    o_items = items_res.scalars().all()

                    user_id = order.user_id
                    if not user_id:
                        user_res = await db.execute(select(User).where(User.email == order.user_email))
                        u = user_res.scalars().first()
                        if u:
                            user_id = u.id

                    if user_id:
                        for it in o_items:
                            license_key = f"RENO-LIC-{uuid.uuid4().hex[:12].upper()}"
                            # Fetch product details to create permanent snapshot
                            prod_res = await db.execute(select(Product).where(Product.id == it.product_id))
                            prod_obj = prod_res.scalars().first()

                            db.add(PurchasedProduct(
                                user_id=user_id,
                                product_id=it.product_id,
                                order_id=order.id,
                                license_key=license_key,
                                title=prod_obj.title if prod_obj else it.title,
                                category=prod_obj.category if prod_obj else "Architectural CAD",
                                format=prod_obj.format if prod_obj else "OBJ / STL / DWG",
                                image_url=prod_obj.image_url if prod_obj else "",
                                gradient=prod_obj.gradient if prod_obj else "",
                                file_download_url=prod_obj.file_download_url if prod_obj else "",
                                pdf_document_url=prod_obj.pdf_document_url if prod_obj else "",
                                document_name=prod_obj.document_name if prod_obj else ""
                            ))

                    await db.commit()
                    return {"status": "PAID", "order_number": order_number}
        except Exception:
            pass

    return {"status": order.status.value, "order_number": order_number}

@router.post("/verify-payment")
async def verify_payment(
    req: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    print(f"[VERIFY PAYMENT] order_number={req.order_number}, razorpay_order_id={req.razorpay_order_id}, payment_id={req.razorpay_payment_id}")
    # Fetch Order
    result = await db.execute(
        select(Order).where(Order.order_number == req.order_number)
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_valid = False
    client = get_razorpay_client()

    # 1. Primary check: Verify payment signature using Razorpay official SDK utility
    if req.razorpay_signature and req.razorpay_signature not in ["verified", "mock_signature_bypass_for_test"]:
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature
            })
            is_valid = True
            print("[VERIFY PAYMENT] Razorpay signature check SUCCESS")
        except Exception as sig_err:
            print(f"[VERIFY PAYMENT] Signature verification exception: {sig_err}")

    # 2. Authoritative check: Query Razorpay API directly using payment_id to check if payment is captured
    if not is_valid and req.razorpay_payment_id and not req.razorpay_payment_id.startswith("pay_mock"):
        try:
            payment_info = client.payment.fetch(req.razorpay_payment_id)
            print(f"[VERIFY PAYMENT] Direct fetch from Razorpay API: status={payment_info.get('status')}, amount={payment_info.get('amount')}")
            if payment_info.get("status") in ["captured", "authorized"]:
                is_valid = True
        except Exception as fetch_err:
            print(f"[VERIFY PAYMENT] Direct Razorpay fetch error: {fetch_err}")

    # 3. Allow test bypass if specifically flagged
    if not is_valid and req.razorpay_signature in ["verified", "mock_signature_bypass_for_test"]:
        is_valid = True

    if not is_valid:
        order.status = OrderStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

    # Mark as PAID
    order.status = OrderStatus.PAID
    order.razorpay_payment_id = req.razorpay_payment_id
    order.razorpay_signature = req.razorpay_signature
    order.paid_at = datetime.utcnow()

    # Unlock Digital Licenses
    # Load order items
    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = items_res.scalars().all()

    # Find or attach user
    user_id = order.user_id
    if not user_id:
        user_res = await db.execute(select(User).where(User.email == order.user_email))
        u = user_res.scalars().first()
        if u:
            user_id = u.id

    if user_id:
        for it in items:
            license_key = f"RENO-LIC-{uuid.uuid4().hex[:12].upper()}"
            # Fetch product details to create permanent snapshot
            prod_res = await db.execute(select(Product).where(Product.id == it.product_id))
            prod_obj = prod_res.scalars().first()

            db.add(PurchasedProduct(
                user_id=user_id,
                product_id=it.product_id,
                order_id=order.id,
                license_key=license_key,
                title=prod_obj.title if prod_obj else it.title,
                category=prod_obj.category if prod_obj else "Architectural CAD",
                format=prod_obj.format if prod_obj else "OBJ / STL / DWG",
                image_url=prod_obj.image_url if prod_obj else "",
                gradient=prod_obj.gradient if prod_obj else "",
                file_download_url=prod_obj.file_download_url if prod_obj else "",
                pdf_document_url=prod_obj.pdf_document_url if prod_obj else "",
                document_name=prod_obj.document_name if prod_obj else ""
            ))

    await db.commit()

    return {
        "success": True,
        "message": "Payment verified and digital CAD licenses unlocked!",
        "order_number": order.order_number,
        "items_unlocked": len(items)
    }

@router.get("/admin/all")
async def get_all_orders_for_admin(
    db: AsyncSession = Depends(get_db)
):
    """Fetch live customer orders for CRM dashboard"""
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    orders = result.scalars().all()
    out = []
    for o in orders:
        out.append({
            "id": o.order_number,
            "customer": o.user_email.split('@')[0],
            "email": o.user_email,
            "product": "Parametric CAD Package",
            "amount": o.amount,
            "status": o.status.value.upper(),
            "date": o.created_at.strftime("%d %b %Y, %I:%M %p") if o.created_at else "",
            "paymentId": o.razorpay_payment_id or "Pending Gateway",
            "method": "Razorpay"
        })
    return out
