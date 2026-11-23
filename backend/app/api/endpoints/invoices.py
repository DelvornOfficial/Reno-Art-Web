from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import json
import os
import math

from app.core.database import get_db
from app.models.models import Order, OrderItem, PurchasedProduct, User, Product

router = APIRouter(prefix="/invoices", tags=["GST Tax Invoices"])

def number_to_indian_words(n: int) -> str:
    """Convert integer amount to standard Indian Currency wording"""
    if n == 0:
        return "Indian Rupees Zero Only"
    
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
             "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def two_digits(num):
        if num < 20:
            return units[num]
        return tens[num // 10] + (" " + units[num % 10] if num % 10 != 0 else "")
    
    def three_digits(num):
        h = num // 100
        rem = num % 100
        res = ""
        if h > 0:
            res += units[h] + " Hundred"
            if rem > 0:
                res += " and "
        if rem > 0:
            res += two_digits(rem)
        return res
    
    crore = n // 10000000
    rem = n % 10000000
    lakh = rem // 100000
    rem = rem % 100000
    thousand = rem // 1000
    hundreds = rem % 1000
    
    parts = []
    if crore > 0:
        parts.append(two_digits(crore) + " Crore")
    if lakh > 0:
        parts.append(two_digits(lakh) + " Lakh")
    if thousand > 0:
        parts.append(two_digits(thousand) + " Thousand")
    if hundreds > 0:
        parts.append(three_digits(hundreds))
        
    return "Indian Rupees " + " ".join(parts) + " Only"

@router.get("/data/{order_number}")
async def get_invoice_data(order_number: str, db: AsyncSession = Depends(get_db)):
    """API endpoint providing structured dynamic GST Invoice Data for given order"""
    res = await db.execute(select(Order).where(Order.order_number == order_number))
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    order_items = items_res.scalars().all()
    
    # Try fetching buyer details
    buyer_name = ""
    buyer_address = ""
    buyer_gstin = ""
    if order.user_id:
        u_res = await db.execute(select(User).where(User.id == order.user_id))
        user_obj = u_res.scalars().first()
        if user_obj:
            buyer_name = user_obj.name or user_obj.username or ""
            
    items_payload = []
    for it in order_items:
        prod_format = "OBJ / STL / DWG"
        prod_cat = "3D CAD Model"
        prod_desc = "Precision CNC milled toolpath file & digital 3D model with commercial license."
        if it.product_id:
            p_res = await db.execute(select(Product).where(Product.id == it.product_id))
            prod_obj = p_res.scalars().first()
            if prod_obj:
                prod_format = prod_obj.format or prod_format
                prod_cat = prod_obj.category or prod_cat
                prod_desc = prod_obj.description or prod_desc
                
        items_payload.append({
            "title": it.title,
            "category": prod_cat,
            "format": prod_format,
            "desc": prod_desc,
            "sac": "998315",
            "qty": 1,
            "totalPrice": float(it.price)
        })
        
    sig_hash = order.razorpay_signature or f"53579757{order.order_number.replace('-', '')}e55bd7b9a821f0de"
    date_str = order.paid_at.strftime("%d %b %Y") if order.paid_at else (order.created_at.strftime("%d %b %Y") if order.created_at else datetime.utcnow().strftime("%d %b %Y"))

    return {
        "orderNumber": order.order_number,
        "date": date_str,
        "rzpPayId": order.razorpay_payment_id or f"pay_live_{order.order_number[-6:]}",
        "rzpOrdId": order.razorpay_order_id or f"order_{order.order_number[-8:]}",
        "signatureHash": sig_hash,
        "buyerEmail": order.user_email,
        "buyerName": buyer_name,
        "studioName": "",
        "buyerAddress": buyer_address,
        "buyerGstin": buyer_gstin,
        "placeOfSupply": "Delhi (Code 07)",
        "discount": float(order.discount or 0.0),
        "amount": float(order.amount),
        "items": items_payload
    }

@router.get("/render/{order_number}", response_class=HTMLResponse)
async def render_invoice_html(order_number: str, db: AsyncSession = Depends(get_db)):
    """Render the official GST Tax Invoice HTML populated with real database order items"""
    invoice_data = await get_invoice_data(order_number, db)
    
    # Path to official index.html
    template_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "invoice-design", "index.html")
    if not os.path.exists(template_path):
        template_path = "invoice-design/index.html"
        
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Invoice template index.html not found on server")

    # Inject real order as the default REAL_DB_ORDER in the template
    json_data = json.dumps(invoice_data)
    replacement = f"const REAL_DB_ORDER = {json_data};\n      let currentOrder = REAL_DB_ORDER;"
    
    # Target replacement
    target_pattern = "const REAL_DB_ORDER = {"
    idx = html_content.find(target_pattern)
    if idx != -1:
        # Find closing semicolon of currentOrder assignment
        end_idx = html_content.find("let currentOrder = JSON.parse(JSON.stringify(REAL_DB_ORDER));", idx)
        if end_idx != -1:
            end_idx += len("let currentOrder = JSON.parse(JSON.stringify(REAL_DB_ORDER));")
            html_content = html_content[:idx] + replacement + html_content[end_idx:]

    return HTMLResponse(content=html_content, status_code=200)
