from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import Product, User, UserRole, MembershipPlan, AppSetting
from app.core.security import get_password_hash
from app.core.config import settings

INITIAL_DESIGNS = [
    {
        "id": "rd-001",
        "title": "Fluted Acoustic Wave Panel",
        "category": "3D Wall Panels",
        "format": "OBJ / STL / STEP",
        "price": 499.0,
        "original_price": 1299.0,
        "badge": "Bestseller",
        "poly_count": "48k Polys",
        "description": "Seamless fluted panel for architectural interiors and luxury living rooms.",
        "gradient": "linear-gradient(135deg, #1A1A1E 0%, #2D2D35 100%)"
    },
    {
        "id": "rd-002",
        "title": "Islamic Geometric CNC Jali",
        "category": "CNC Jali Patterns",
        "format": "DXF / DWG / CDR",
        "price": 299.0,
        "original_price": 799.0,
        "badge": "Popular",
        "poly_count": "Vector CAD",
        "description": "Precision laser & router cutting CAD vectors for facade screens and partitions.",
        "gradient": "linear-gradient(135deg, #24221F 0%, #3D3934 100%)"
    },
    {
        "id": "rd-003",
        "title": "Parametric Diamond Facade",
        "category": "Parametric Facades",
        "format": "3DM / OBJ / STL",
        "price": 899.0,
        "original_price": 1999.0,
        "badge": "Trending",
        "poly_count": "92k Polys",
        "description": "Computational diamond relief suitable for modern exterior facades & 3D printing.",
        "gradient": "linear-gradient(135deg, #18191C 0%, #282C34 100%)"
    },
    {
        "id": "rd-004",
        "title": "Hexagonal Textured Stone Tile",
        "category": "3D Elevation Tiles",
        "format": "MAX / FBX / OBJ",
        "price": 399.0,
        "original_price": 899.0,
        "badge": "New",
        "poly_count": "34k Polys",
        "description": "PBR textured interlocking hex tile for exterior wall elevations and bathrooms.",
        "gradient": "linear-gradient(135deg, #2A2826 0%, #3B3833 100%)"
    },
    {
        "id": "rd-005",
        "title": "Coffered Classical Ceiling Medallion",
        "category": "Ceiling & Molding",
        "format": "STL / OBJ / 3DS",
        "price": 549.0,
        "original_price": 1199.0,
        "badge": "Instant DL",
        "poly_count": "110k Polys",
        "description": "Neoclassical ceiling centerpiece ready for high-resolution CNC carving & casting.",
        "gradient": "linear-gradient(135deg, #22201D 0%, #36322C 100%)"
    },
    {
        "id": "rd-006",
        "title": "Organic Ripple Wave Tile 600x600",
        "category": "3D Elevation Tiles",
        "format": "STL / OBJ / DWG",
        "price": 449.0,
        "original_price": 999.0,
        "badge": "Staff Pick",
        "poly_count": "56k Polys",
        "description": "Continuous sand ripple texture module for seamless feature walls and hotel lobbies.",
        "gradient": "linear-gradient(135deg, #1C1E22 0%, #2E333B 100%)"
    }
]

async def seed_initial_products(db: AsyncSession):
    # 1. Check if initial seed was already completed once.
    # If yes, NEVER re-insert default demo products, even if the user deleted them!
    seed_flag_result = await db.execute(select(AppSetting).where(AppSetting.key == "initial_seed_completed"))
    seed_flag = seed_flag_result.scalars().first()

    if not seed_flag:
        # Check if database has any products currently
        result = await db.execute(select(Product))
        existing = result.scalars().first()
        if not existing:
            for p in INITIAL_DESIGNS:
                db.add(Product(
                    id=p["id"],
                    title=p["title"],
                    category=p["category"],
                    format=p["format"],
                    price=p["price"],
                    original_price=p["original_price"],
                    badge=p["badge"],
                    poly_count=p["poly_count"],
                    description=p["description"],
                    gradient=p["gradient"],
                    is_published=True
                ))
            await db.commit()
        
        # Mark initial seeding completed permanently in the database
        db.add(AppSetting(key="initial_seed_completed", value="true"))
        await db.commit()

    # 2. Seed / Update Master Admin dynamically from .env with Bcrypt Hash (Never plain text in DB)
    admin_uname = (settings.ADMIN_USERNAME or "Reno@1#1@Admin").strip()
    admin_pw = (settings.ADMIN_PASSWORD or "Reno#/adminHarsh1@2").strip()

    admin_result = await db.execute(select(User).where((User.username == admin_uname) | (User.email == "admin@renoart.in")))
    existing_admin = admin_result.scalars().first()
    hashed_pw = get_password_hash(admin_pw)

    if not existing_admin:
        admin_user = User(
            email="admin@renoart.in",
            username=admin_uname,
            name="Studio SuperAdmin",
            hashed_password=hashed_pw,
            role=UserRole.ADMIN,
            plan=MembershipPlan.PREMIUM,
            is_active=True
        )
        db.add(admin_user)
        await db.commit()
    else:
        # Update credentials dynamically from .env
        existing_admin.username = admin_uname
        existing_admin.hashed_password = hashed_pw
        existing_admin.role = UserRole.ADMIN
        existing_admin.is_active = True
        await db.commit()
