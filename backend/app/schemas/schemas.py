from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class UserCreate(UserBase):
    password: str
    cf_token: Optional[str] = None

class UserLogin(BaseModel):
    username_or_email: Optional[str] = None
    email: Optional[str] = None
    password: str
    cf_token: Optional[str] = None

class UserOut(UserBase):
    id: int
    plan: str
    subscription_tier_id: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None
    subscription_started_at: Optional[datetime] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    slug: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Media Gallery Schemas ---
class MediaGalleryCreate(BaseModel):
    title: Optional[str] = None
    url: str
    media_type: Optional[str] = "product_image"

class MediaGalleryOut(BaseModel):
    id: int
    title: Optional[str] = None
    url: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    id: str
    title: str
    category: str
    format: Optional[str] = "OBJ / STL / DWG"
    price: float
    original_price: Optional[float] = None
    badge: Optional[str] = None
    poly_count: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    product_images: Optional[List[str]] = None
    description_images: Optional[List[str]] = None
    gallery_images: Optional[List[str]] = None
    gradient: Optional[str] = None
    file_download_url: Optional[str] = None
    pdf_document_url: Optional[str] = None
    document_name: Optional[str] = None
    mesh_topology: Optional[str] = "Closed Manifold / Slicer Optimized"
    machine_compatibility: Optional[str] = "3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser"
    supported_cam: Optional[str] = "ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD"
    commercial_license: Optional[str] = "Unlimited Physical Fabrication - Royalty-Free"
    custom_specs: Optional[List[dict]] = None
    purchases_count: Optional[int] = 0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    format: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    mrp: Optional[float] = None
    category_id: Optional[str] = None
    badge: Optional[str] = None
    poly_count: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    product_images: Optional[List[str]] = None
    description_images: Optional[List[str]] = None
    gallery_images: Optional[List[str]] = None
    gradient: Optional[str] = None
    file_download_url: Optional[str] = None
    pdf_document_url: Optional[str] = None
    document_name: Optional[str] = None
    mesh_topology: Optional[str] = None
    machine_compatibility: Optional[str] = None
    supported_cam: Optional[str] = None
    commercial_license: Optional[str] = None
    custom_specs: Optional[List[dict]] = None
    is_published: Optional[bool] = None

class ProductOut(ProductBase):
    is_published: Optional[bool] = True

    class Config:
        from_attributes = True

# --- Media Gallery Schemas ---
class MediaGalleryCreate(BaseModel):
    title: Optional[str] = None
    url: str
    media_type: Optional[str] = "product_image"

class MediaGalleryOut(BaseModel):
    id: int
    title: Optional[str] = None
    url: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Review Schemas ---
class ReviewCreate(BaseModel):
    rating: int
    comment: str

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    product_id: str
    user_id: int
    user_name: str
    user_email: str
    rating: int
    comment: str
    created_at: datetime
    updated_at: datetime
    can_edit: Optional[bool] = False

    class Config:
        from_attributes = True

# --- Media Gallery Schemas ---
class MediaGalleryCreate(BaseModel):
    title: Optional[str] = None
    url: str
    media_type: Optional[str] = "product_image"

class MediaGalleryOut(BaseModel):
    id: int
    title: Optional[str] = None
    url: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Activity & Customer CRM Schemas ---
class ActivityPing(BaseModel):
    cart_items_count: Optional[int] = 0
    cart_product_ids: Optional[str] = ""
    current_page: Optional[str] = ""
    current_product_id: Optional[str] = ""
    current_product_title: Optional[str] = ""
    time_spent_seconds: Optional[int] = 0
    page_dwell_times: Optional[dict] = None
    funnel_stage: Optional[str] = None
    cart_dropoff_event: Optional[dict] = None

class CustomerDetailOut(BaseModel):
    id: int
    name: Optional[str] = None
    username: Optional[str] = None
    email: str
    profile_image: Optional[str] = None
    plan: str
    role: str
    created_at: datetime
    cart_items_count: int = 0
    cart_product_ids: str = ""
    current_page: str = ""
    current_product_id: str = ""
    current_product_title: str = ""
    time_spent_seconds: int = 0
    page_dwell_times: Optional[dict] = None
    funnel_stage: Optional[str] = "Browsing"
    cart_dropoffs: Optional[list] = None
    last_active: Optional[datetime] = None
    orders_count: int = 0
    purchases_count: int = 0

class CustomerPurchaseHistoryItem(BaseModel):
    id: int
    product_id: Optional[str] = None
    title: str
    format: Optional[str] = None
    category: Optional[str] = None
    license_key: str
    image_url: Optional[str] = None
    purchased_at: datetime
    is_revoked: bool = False
    revocation_reason: Optional[str] = None
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerDetailedAnalytics(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: str
    username: Optional[str] = None
    plan: str
    subscription_tier_id: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None
    subscription_started_at: Optional[datetime] = None
    role: str
    created_at: datetime
    last_active: Optional[datetime] = None
    total_time_spent_seconds: int = 0
    current_page: str = ""
    current_product_title: str = ""
    cart_items_count: int = 0
    page_dwell_times: dict = {}
    funnel_stage: str = "Browsing"
    cart_dropoffs: list = []
    purchased_products: List[CustomerPurchaseHistoryItem] = []
    total_spent: float = 0.0
    orders_count: int = 0

class RevokePurchaseRequest(BaseModel):
    purchased_product_id: int
    reason: str

class SendCustomerEmailRequest(BaseModel):
    subject: str
    message: str

# --- Order / Checkout Schemas ---
class CartItem(BaseModel):
    id: str
    price: float
    title: str

class CreateOrderRequest(BaseModel):
    email: EmailStr
    items: List[CartItem]
    coupon_code: Optional[str] = None

class RazorpayOrderOut(BaseModel):
    order_id: int
    order_number: str
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    order_number: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PurchasedProductOut(BaseModel):
    id: int
    product_id: Optional[str] = None
    title: str
    format: Optional[str] = "OBJ / STL / DWG"
    category: Optional[str] = "Architectural CAD"
    license_key: str
    file_download_url: Optional[str] = None
    download_url: Optional[str] = None
    pdf_document_url: Optional[str] = None
    document_name: Optional[str] = None
    image_url: Optional[str] = None
    gradient: Optional[str] = None
    purchased_at: datetime
    price_paid: Optional[float] = None
    order_number: Optional[str] = None
    invoice_number: Optional[str] = None
    payment_method: Optional[str] = "Razorpay / UPI"
    description: Optional[str] = None

    class Config:
        from_attributes = True

# --- Media Gallery Schemas ---
class MediaGalleryCreate(BaseModel):
    title: Optional[str] = None
    url: str
    media_type: Optional[str] = "product_image"

class MediaGalleryOut(BaseModel):
    id: int
    title: Optional[str] = None
    url: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True
