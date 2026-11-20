from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.seed import seed_initial_products
from app.core.limiter import limiter
from app.api.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not exist & auto-migrate missing columns
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Auto-add missing columns to existing PostgreSQL tables if not present
        await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS pdf_document_url TEXT;"))
        await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS title VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS format VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS image_url TEXT;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS gradient VARCHAR(255);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS file_download_url VARCHAR(500);"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS pdf_document_url TEXT;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);"))
        # Make product_id nullable in purchased_products so deleting from catalog never cascades to user's purchase
        await conn.execute(text("ALTER TABLE purchased_products ALTER COLUMN product_id DROP NOT NULL;"))
        # Advanced Customer Telemetry & Product Revocation Migration
        await conn.execute(text("ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS page_dwell_times JSON;"))
        await conn.execute(text("ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50);"))
        await conn.execute(text("ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS cart_dropoffs JSON;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS revocation_reason TEXT;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;"))

        # Fix Foreign Key constraints so deleting catalog products never breaks order_items or reviews
        await conn.execute(text("ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;"))
        await conn.execute(text("ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;"))
        await conn.execute(text("ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;"))
        await conn.execute(text("ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;"))
        await conn.execute(text("ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;"))
        await conn.execute(text("ALTER TABLE purchased_products DROP CONSTRAINT IF EXISTS purchased_products_product_id_fkey;"))
        await conn.execute(text("ALTER TABLE purchased_products ADD CONSTRAINT purchased_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;"))
    
    async with AsyncSessionLocal() as session:
        await seed_initial_products(session)
        
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Performance Asynchronous E-Commerce API for RENO DESIGN Studio (3D Architecture & CNC Marketplace)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Connect SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware (Allows frontend on renoart.in, CRM, localhost, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Real-Time WebSocket for instant sync without reload
from fastapi import WebSocket, WebSocketDisconnect
from app.core.ws import manager

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "RENO DESIGN API",
        "version": settings.VERSION,
        "environment": "production"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
