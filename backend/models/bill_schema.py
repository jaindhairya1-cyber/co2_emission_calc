from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class FieldWithConfidence(BaseModel):
    value: Optional[Any] = None
    confidence: float = 1.0

class CommonBillFields(BaseModel):
    vendor_name: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    buyer_name: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    buyer_gstin: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    bill_number: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    bill_date: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    billing_period: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    total_amount_inr: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class TransportData(BaseModel):
    vehicle_type: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    vehicle_number: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    fuel_type: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    total_distance_km: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    total_weight_kg: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    routes: FieldWithConfidence = Field(default_factory=lambda: FieldWithConfidence(value=[]))
    amount: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class FuelLineItem(BaseModel):
    fuel_type: str = "Diesel"
    quantity: float = 0.0
    unit: str = "Litres"
    rate: Optional[float] = None
    amount: Optional[float] = None
    confidence: float = 0.9

class FuelData(BaseModel):
    line_items: List[FuelLineItem] = Field(default_factory=list)
    diesel_litres: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    petrol_litres: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    lpg_cylinders: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    amount: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class RawMaterialLineItem(BaseModel):
    item_name: str = ""
    material_type: str = "Cotton"
    quantity: float = 0.0
    unit: str = "kg"
    rate: Optional[float] = None
    amount: Optional[float] = None
    weight_kg: Optional[float] = None
    confidence: float = 0.9

class RawMaterialData(BaseModel):
    line_items: List[RawMaterialLineItem] = Field(default_factory=list)
    cotton_kg: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    polyester_kg: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    total_material_weight_kg: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    amount: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class WasteLineItem(BaseModel):
    waste_type: str = ""
    quantity_kg: float = 0.0
    disposal_method: str = "Recycling"
    rate: Optional[float] = None
    amount: Optional[float] = None
    confidence: float = 0.9

class WasteData(BaseModel):
    line_items: List[WasteLineItem] = Field(default_factory=list)
    total_waste_kg: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    waste_types_count: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    amount: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class ElectricityData(BaseModel):
    consumer_number: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    units_consumed_kwh: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    previous_reading: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    current_reading: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    billing_period: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    tariff_category: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    sanctioned_load: FieldWithConfidence = Field(default_factory=FieldWithConfidence)
    amount: FieldWithConfidence = Field(default_factory=FieldWithConfidence)

class ValidationFlag(BaseModel):
    field: str
    type: str  # "info" | "warning" | "error"
    message: str

class BusinessVerification(BaseModel):
    is_match: bool = True
    similarity_score: float = 1.0
    extracted_buyer_name: Optional[str] = None
    extracted_buyer_gstin: Optional[str] = None
    warning: Optional[str] = None

class BillExtractionResponse(BaseModel):
    status: str = "success"
    file_url: str = ""
    file_name: str = ""
    detected_category: str = "Electricity"
    category_matches_page: bool = True
    business_verification: BusinessVerification = Field(default_factory=BusinessVerification)
    common_fields: CommonBillFields = Field(default_factory=CommonBillFields)
    category_data: Dict[str, Any] = Field(default_factory=dict)
    validation_flags: List[ValidationFlag] = Field(default_factory=list)
    calculated_emissions: Dict[str, Any] = Field(default_factory=dict)
