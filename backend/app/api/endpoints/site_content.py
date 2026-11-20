from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
from app.core.database import get_db
from app.models.models import AppSetting
from app.core.ws import manager
from app.core.default_legal import DEFAULT_LEGAL_DOCS

router = APIRouter(prefix="/site-content", tags=["Site Hero, Footer & Content Settings"])

DEFAULT_CONTENT = {
    "announcement_tagline": "Tiles designing & 3D architectural patterns | Instant Digital",
    "hero_pill": "Verified Production CNC & 3D Print Files",
    "hero_title": "Architectural 3D & CNC Design Marketplace",
    "hero_description": "Instant digital downloads for CNC stone routing, 3D printing, laser Jali cutting, and interior wall panels. Production-ready files in STL, OBJ, DXF, and DWG.",
    "stat_1_val": "500+",
    "stat_1_lbl": "Digital Assets",
    "stat_2_val": "100%",
    "stat_2_lbl": "CNC Toolpath Ready",
    "stat_3_val": "Instant",
    "stat_3_lbl": "Secure Delivery",
    
    # Footer Settings
    "footer_tagline": "Precision 3D elevation tiles, laser CNC Jali vectors, and parametric facade models engineered for architecture & manufacturing.",
    "footer_phone": "+919876543210",
    "footer_email": "contact@renodesign.in",
    "footer_show_phone": "true",
    "footer_show_email": "true",
    "footer_show_catalog": "true",
    "footer_show_cad": "true",
    "footer_catalog_items": "3D Elevation Tiles, CNC Jali Patterns, Acoustic Wall Panels, Parametric Facades, Ceiling Medallions",
    "footer_cad_items": "STL / OBJ (3D Printing), DXF / DWG (AutoCAD), CDR (CorelDraw Laser), STEP / IGES (CNC)",
    
    # Legal & Privacy Pages
    "legal_terms": json.dumps(DEFAULT_LEGAL_DOCS["terms"]),
    "legal_privacy": json.dumps(DEFAULT_LEGAL_DOCS["privacy"]),
    "legal_refund": json.dumps(DEFAULT_LEGAL_DOCS["refund"]),
    "legal_license": json.dumps(DEFAULT_LEGAL_DOCS["license"])
}

class SiteContentUpdate(BaseModel):
    announcement_tagline: Optional[str] = None
    hero_pill: Optional[str] = None
    hero_title: Optional[str] = None
    hero_description: Optional[str] = None
    stat_1_val: Optional[str] = None
    stat_1_lbl: Optional[str] = None
    stat_2_val: Optional[str] = None
    stat_2_lbl: Optional[str] = None
    stat_3_val: Optional[str] = None
    stat_3_lbl: Optional[str] = None
    
    # Footer fields
    footer_tagline: Optional[str] = None
    footer_phone: Optional[str] = None
    footer_email: Optional[str] = None
    footer_show_phone: Optional[str] = None
    footer_show_email: Optional[str] = None
    footer_show_catalog: Optional[str] = None
    footer_show_cad: Optional[str] = None
    footer_catalog_items: Optional[str] = None
    footer_cad_items: Optional[str] = None
    
    # Legal and policies
    legal_terms: Optional[str] = None
    legal_privacy: Optional[str] = None
    legal_refund: Optional[str] = None
    legal_license: Optional[str] = None

@router.get("", include_in_schema=False)
@router.get("/")
async def get_site_content(db: AsyncSession = Depends(get_db)):
    """Fetch current live site hero, footer & announcement text directly from DB"""
    res = await db.execute(select(AppSetting).where(AppSetting.key.like("site_content_%")))
    settings_rows = res.scalars().all()
    
    # Start with baseline defaults
    data = dict(DEFAULT_CONTENT)
    for row in settings_rows:
        field_key = row.key.replace("site_content_", "")
        # PERSISTENCE FIX: If value is in database (even if empty string or boolean 'false'),
        # NEVER ignore it! Overwrite the default with the user's actual saved preference.
        if row.value is not None:
            # If it's a legal document and row.value is empty, fallback to template
            if field_key.startswith("legal_") and not row.value.strip():
                continue
            data[field_key] = row.value
            
    return data

@router.post("", include_in_schema=False)
@router.post("/")
async def update_site_content(content: SiteContentUpdate, db: AsyncSession = Depends(get_db)):
    """Update storefront hero banner, announcement, footer and policies from Admin CRM"""
    updated_fields = content.model_dump(exclude_unset=True)
    
    for k, v in updated_fields.items():
        db_key = f"site_content_{k}"
        res = await db.execute(select(AppSetting).where(AppSetting.key == db_key))
        setting_row = res.scalars().first()
        if setting_row:
            setting_row.value = str(v) if v is not None else ""
        else:
            db.add(AppSetting(key=db_key, value=str(v) if v is not None else ""))
            
    await db.commit()
    
    # Broadcast realtime event so all storefront clients update instantly without manual reload
    await manager.broadcast({
        "event": "SITE_CONTENT_UPDATED",
        "data": updated_fields
    })
    
    return {"status": "success", "updated": updated_fields}
