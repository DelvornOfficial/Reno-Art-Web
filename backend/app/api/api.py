from fastapi import APIRouter
from app.api.endpoints import auth, products, orders, profile, categories, reviews, customers, gallery

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(categories.router)
api_router.include_router(orders.router)
api_router.include_router(profile.router)
api_router.include_router(reviews.router)
api_router.include_router(customers.router)
api_router.include_router(gallery.router)
