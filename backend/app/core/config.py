from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "RENO DESIGN API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server Port
    PORT: int = 1002
    HOST: str = "0.0.0.0"
    
    # Security / JWT
    SECRET_KEY: str = "reno-design-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 Days
    
    # PostgreSQL Database URL (Default asyncpg for FastAPI)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/renodesign_db"
    )
    
    # Razorpay Gateway
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_placeholder")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "placeholder_webhook_secret")
    
    # Cloudflare Turnstile
    CLOUDFLARE_TURNSTILE_SECRET: str = os.getenv("CLOUDFLARE_TURNSTILE_SECRET", "0x4AAAAAAGIrjePZeO23va5f_j8kaTAnhdg")
    CLOUDFLARE_TURNSTILE_SITEKEY: str = os.getenv("CLOUDFLARE_TURNSTILE_SITEKEY", "0x4AAAAAAGIrjSoFxBrA9w-b")
    
    # Master Admin Credentials (Strictly from .env)
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    
    # Master Admin Credentials (Strictly from .env)
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    
    # CORS Origins (Allow all local network IP and domains)
    CORS_ORIGINS: List[str] = [
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
