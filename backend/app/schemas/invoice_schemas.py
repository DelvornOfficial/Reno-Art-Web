from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class InvoiceItemSchema(BaseModel):
    title: str
    category: Optional[str] = "3D CAD Model"
    format: Optional[str] = "OBJ / STL / DWG"
    desc: Optional[str] = "Architectural CAD model and toolpath with commercial production rights."
    sac: Optional[str] = "998315"
    qty: int = 1
    totalPrice: float

class InvoiceDataSchema(BaseModel):
    orderNumber: str
    date: str
    rzpPayId: str
    rzpOrdId: str
    signatureHash: str
    buyerEmail: str
    buyerName: str = ""
    studioName: str = ""
    buyerAddress: str = ""
    buyerGstin: str = ""
    placeOfSupply: str = "Delhi (Code 07)"
    discount: float = 0.0
    items: List[InvoiceItemSchema]
    amount: float
