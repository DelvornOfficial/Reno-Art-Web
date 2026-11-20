import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class MembershipPlan(str, enum.Enum):
    NORMAL = "normal"
    PREMIUM = "premium"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(50), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    plan = Column(Enum(MembershipPlan), default=MembershipPlan.NORMAL, nullable=False)
    profile_image = Column(Text, default="", nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    purchases = relationship("PurchasedProduct", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, index=True) # e.g. "rd-001"
    title = Column(String(255), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    format = Column(String(100), nullable=False) # "OBJ / STL / DWG"
    price = Column(Float, nullable=False) # Selling Price (INR)
    original_price = Column(Float, nullable=True) # MRP (INR)
    badge = Column(String(50), nullable=True)
    poly_count = Column(String(50), nullable=True)
    description = Column(Text, nullable=True) # Short details
    image_url = Column(Text, nullable=True) # Primary Product Image URL / Base64
    product_images = Column(JSON, default=list, nullable=True) # Multiple product images
    description_images = Column(JSON, default=list, nullable=True) # Separate description images (renders/details)
    gallery_images = Column(JSON, default=list, nullable=True) # Backward compatibility
    gradient = Column(String(255), nullable=True)
    file_download_url = Column(String(500), nullable=True) # CAD archive
    pdf_document_url = Column(Text, nullable=True) # Protected PDF / Documentation / Spec sheets
    document_name = Column(String(255), nullable=True) # Name of attached doc/pdf
    mesh_topology = Column(String(255), default="Closed Manifold / Slicer Optimized")
    machine_compatibility = Column(String(500), default="3-Axis CNC Router, 5-Axis Stone Mill, 3D Printer, Fiber Laser")
    supported_cam = Column(String(500), default="ArtCAM, Vectric Aspire, Fusion 360, RhinoCAM, AutoCAD")
    commercial_license = Column(String(500), default="Unlimited Physical Fabrication - Royalty-Free")
    custom_specs = Column(JSON, default=list, nullable=True) # Dynamic key-value spec pairs
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(64), unique=True, index=True, nullable=False) # RENO-ORD-XXXX
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable for guest purchases
    user_email = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, index=True)
    
    # Razorpay Details
    razorpay_order_id = Column(String(100), index=True, nullable=True)
    razorpay_payment_id = Column(String(100), index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(50), nullable=True) # Nullable so deleting product keeps order history
    price = Column(Float, nullable=False)
    title = Column(String(255), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", foreign_keys=[product_id], primaryjoin="OrderItem.product_id == Product.id")

class PurchasedProduct(Base):
    """Instant digital license & downloads linked to user profile - Permanent Asset Snapshot"""
    __tablename__ = "purchased_products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(String(50), nullable=True) # Nullable so deleting from storefront doesn't delete user's purchase!
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    license_key = Column(String(100), unique=True, nullable=False)
    
    # Permanent Asset Snapshot: even if admin deletes the product from catalog, buyer retains all details forever
    title = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    format = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    gradient = Column(String(255), nullable=True)
    file_download_url = Column(String(500), nullable=True)
    pdf_document_url = Column(Text, nullable=True)
    document_name = Column(String(255), nullable=True)
    
    purchased_at = Column(DateTime, default=datetime.utcnow)
    is_revoked = Column(Boolean, default=False)
    revocation_reason = Column(Text, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="purchases")
    product = relationship("Product", foreign_keys=[product_id], primaryjoin="PurchasedProduct.product_id == Product.id")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(255), nullable=False)
    user_email = Column(String(255), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5 stars
    comment = Column(Text, nullable=False) # Review text only
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class UserActivity(Base):
    __tablename__ = "user_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_email = Column(String(255), nullable=False)
    cart_items_count = Column(Integer, default=0)
    cart_product_ids = Column(Text, default="")
    current_page = Column(String(255), default="")
    current_product_id = Column(String(50), default="")
    current_product_title = Column(String(255), default="")
    time_spent_seconds = Column(Integer, default=0)
    page_dwell_times = Column(JSON, default=dict) # e.g. {"home": 510, "product_detail": 850, "billing": 165, "profile": 720}
    cart_dropoffs = Column(JSON, default=list) # e.g. [{"action": "added", "title": "Neo Classical", "time": "..."}, {"action": "abandoned_at_billing"}]
    funnel_stage = Column(String(50), default="Browsing") # "Browsing", "Added to Cart", "Reached Billing", "Purchased"
    last_active = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")

class MediaGallery(Base):
    __tablename__ = "media_gallery"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    url = Column(Text, nullable=False)
    media_type = Column(String(50), default="product_image") # "product_image", "description_image", "user_profile"
    created_at = Column(DateTime, default=datetime.utcnow)

class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

