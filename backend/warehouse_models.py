"""
Warehouse Management System Models
Complete inventory management with locations, stock tracking, serial numbers, and barcode support
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
from models import CompanyBaseModel


# ============================================================================
# WAREHOUSE & LOCATIONS
# ============================================================================

class WarehouseType(str, Enum):
    MAIN = "main"
    REGIONAL = "regional"
    RETAIL = "retail"
    TRANSIT = "transit"

class Warehouse(CompanyBaseModel):
    """Warehouse Master"""
    warehouse_code: str
    warehouse_name: str
    warehouse_name_ar: Optional[str] = None
    warehouse_type: WarehouseType
    address: Optional[str] = None
    city: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class WarehouseCreate(BaseModel):
    warehouse_code: str
    warehouse_name: str
    warehouse_name_ar: Optional[str] = None
    warehouse_type: WarehouseType
    address: Optional[str] = None
    city: Optional[str] = None

class StorageLocation(CompanyBaseModel):
    """Storage Bins/Locations within Warehouse"""
    location_code: str
    location_name: str
    warehouse_id: str
    warehouse_name: str
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    is_active: bool = True

class StorageLocationCreate(BaseModel):
    location_code: str
    location_name: str
    warehouse_id: str
    aisle: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None


# ============================================================================
# PRODUCTS & INVENTORY
# ============================================================================

class ProductType(str, Enum):
    RAW_MATERIAL = "raw_material"
    FINISHED_GOODS = "finished_goods"
    SEMI_FINISHED = "semi_finished"
    SPARE_PARTS = "spare_parts"
    CONSUMABLES = "consumables"

class UnitOfMeasure(str, Enum):
    PIECE = "piece"
    KG = "kg"
    LITER = "liter"
    METER = "meter"
    SQUARE_METER = "square_meter"
    CUBIC_METER = "cubic_meter"
    TON = "ton"
    BOX = "box"
    PALLET = "pallet"

class Product(CompanyBaseModel):
    """Product/Item Master"""
    product_code: str
    product_name: str
    product_name_ar: Optional[str] = None
    product_type: ProductType
    category: Optional[str] = None
    
    # Units
    unit_of_measure: UnitOfMeasure
    unit_cost: float = 0.0
    unit_price: float = 0.0
    
    # Tracking
    track_serial_numbers: bool = False
    track_batch_numbers: bool = False
    track_expiry: bool = False
    
    # Stock Levels
    reorder_level: Optional[float] = None
    reorder_quantity: Optional[float] = None
    min_stock_level: Optional[float] = None
    max_stock_level: Optional[float] = None
    
    # Accounting
    inventory_account_id: Optional[str] = None
    cogs_account_id: Optional[str] = None
    
    # Physical Properties
    weight: Optional[float] = None
    dimensions: Optional[str] = None
    
    # Supplier
    default_supplier_id: Optional[str] = None
    supplier_part_number: Optional[str] = None
    
    barcode: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None

class ProductCreate(BaseModel):
    product_code: str
    product_name: str
    product_name_ar: Optional[str] = None
    product_type: ProductType
    unit_of_measure: UnitOfMeasure
    unit_cost: Optional[float] = 0.0
    unit_price: Optional[float] = 0.0
    track_serial_numbers: Optional[bool] = False
    track_batch_numbers: Optional[bool] = False
    barcode: Optional[str] = None


# ============================================================================
# STOCK/INVENTORY
# ============================================================================

class StockBalance(CompanyBaseModel):
    """Current Stock Balance per Product per Location"""
    product_id: str
    product_code: str
    product_name: str
    warehouse_id: str
    warehouse_name: str
    location_id: Optional[str] = None
    location_name: Optional[str] = None
    
    quantity_on_hand: float = 0.0
    quantity_reserved: float = 0.0
    quantity_available: float = 0.0
    
    unit_cost: float = 0.0
    total_value: float = 0.0
    
    last_movement_date: Optional[datetime] = None

class SerialNumber(CompanyBaseModel):
    """Serial Number Tracking"""
    serial_number: str
    product_id: str
    product_code: str
    product_name: str
    warehouse_id: str
    location_id: Optional[str] = None
    status: str = "available"  # available, reserved, issued
    received_date: Optional[datetime] = None
    issued_date: Optional[datetime] = None

class BatchNumber(CompanyBaseModel):
    """Batch/Lot Number Tracking"""
    batch_number: str
    product_id: str
    product_code: str
    product_name: str
    warehouse_id: str
    location_id: Optional[str] = None
    
    quantity: float = 0.0
    manufacturing_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    supplier_id: Optional[str] = None
    status: str = "available"


# ============================================================================
# STOCK MOVEMENTS
# ============================================================================

class MovementType(str, Enum):
    RECEIPT = "receipt"  # Goods Receipt
    ISSUE = "issue"  # Goods Issue
    TRANSFER = "transfer"  # Warehouse Transfer
    ADJUSTMENT = "adjustment"  # Stock Adjustment
    RETURN = "return"  # Return to Supplier

class StockMovement(CompanyBaseModel):
    """Stock Movement Transactions"""
    movement_number: str
    movement_date: datetime
    movement_type: MovementType
    
    product_id: str
    product_code: str
    product_name: str
    
    # Source
    from_warehouse_id: Optional[str] = None
    from_location_id: Optional[str] = None
    
    # Destination
    to_warehouse_id: Optional[str] = None
    to_location_id: Optional[str] = None
    
    quantity: float
    unit_cost: float
    total_cost: float
    
    # Tracking
    serial_numbers: List[str] = Field(default_factory=list)
    batch_number: Optional[str] = None
    
    # Reference
    reference_type: Optional[str] = None  # PO, Sales Order, etc.
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    
    notes: Optional[str] = None
    created_by: str
    approved_by: Optional[str] = None
    is_approved: bool = False

class StockMovementCreate(BaseModel):
    movement_date: datetime
    movement_type: MovementType
    product_id: str
    from_warehouse_id: Optional[str] = None
    from_location_id: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    to_location_id: Optional[str] = None
    quantity: float
    unit_cost: float
    serial_numbers: Optional[List[str]] = []
    batch_number: Optional[str] = None
    notes: Optional[str] = None


# ============================================================================
# PURCHASE ORDERS & RECEIVING
# ============================================================================

class POStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class PurchaseOrderLine(BaseModel):
    line_number: int
    product_id: str
    product_code: str
    product_name: str
    quantity_ordered: float
    quantity_received: float = 0.0
    unit_price: float
    tax_rate: float = 0.15
    tax_amount: float
    total_amount: float

class PurchaseOrder(CompanyBaseModel):
    """Purchase Orders"""
    po_number: str
    po_date: datetime
    vendor_id: str
    vendor_name: str
    
    warehouse_id: str
    warehouse_name: str
    
    expected_delivery_date: Optional[datetime] = None
    
    lines: List[PurchaseOrderLine] = Field(default_factory=list)
    
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    
    status: POStatus = POStatus.DRAFT
    
    created_by: str
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    
    notes: Optional[str] = None

class PurchaseOrderCreate(BaseModel):
    po_date: datetime
    vendor_id: str
    warehouse_id: str
    expected_delivery_date: Optional[datetime] = None
    lines: List[PurchaseOrderLine]
    notes: Optional[str] = None

class GoodsReceipt(CompanyBaseModel):
    """Goods Receipt Note"""
    grn_number: str
    receipt_date: datetime
    po_id: Optional[str] = None
    po_number: Optional[str] = None
    vendor_id: str
    vendor_name: str
    warehouse_id: str
    warehouse_name: str
    
    items: List[Dict[str, Any]] = Field(default_factory=list)
    
    total_quantity: float = 0.0
    notes: Optional[str] = None
    received_by: str

class GoodsReceiptCreate(BaseModel):
    receipt_date: datetime
    po_id: Optional[str] = None
    vendor_id: str
    warehouse_id: str
    items: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============================================================================
# STOCK ADJUSTMENTS & CYCLE COUNTING
# ============================================================================

class AdjustmentReason(str, Enum):
    DAMAGE = "damage"
    OBSOLETE = "obsolete"
    THEFT = "theft"
    FOUND = "found"
    CYCLE_COUNT = "cycle_count"
    SYSTEM_ERROR = "system_error"

class StockAdjustment(CompanyBaseModel):
    """Stock Adjustments"""
    adjustment_number: str
    adjustment_date: datetime
    adjustment_reason: AdjustmentReason
    
    product_id: str
    product_code: str
    product_name: str
    
    warehouse_id: str
    location_id: Optional[str] = None
    
    quantity_before: float
    quantity_adjusted: float  # Can be positive or negative
    quantity_after: float
    
    unit_cost: float
    adjustment_value: float
    
    notes: Optional[str] = None
    created_by: str
    approved_by: Optional[str] = None

class StockAdjustmentCreate(BaseModel):
    adjustment_date: datetime
    adjustment_reason: AdjustmentReason
    product_id: str
    warehouse_id: str
    location_id: Optional[str] = None
    quantity_adjusted: float
    notes: Optional[str] = None

class CycleCount(CompanyBaseModel):
    """Cycle Count/Physical Inventory"""
    count_number: str
    count_date: datetime
    warehouse_id: str
    warehouse_name: str
    
    counted_by: str
    verified_by: Optional[str] = None
    
    items: List[Dict[str, Any]] = Field(default_factory=list)  # product_id, system_qty, counted_qty, variance
    
    status: str = "in_progress"  # in_progress, completed
    notes: Optional[str] = None

class CycleCountCreate(BaseModel):
    count_date: datetime
    warehouse_id: str
    items: List[Dict[str, Any]]
    notes: Optional[str] = None


# ============================================================================
# INVENTORY REPORTS
# ============================================================================

class StockValuationReport(BaseModel):
    report_date: datetime
    warehouse_id: Optional[str] = None
    items: List[Dict[str, Any]] = Field(default_factory=list)
    total_value: float = 0.0

class StockMovementReport(BaseModel):
    from_date: datetime
    to_date: datetime
    product_id: Optional[str] = None
    warehouse_id: Optional[str] = None
    movements: List[Dict[str, Any]] = Field(default_factory=list)

class StockAgingReport(BaseModel):
    report_date: datetime
    warehouse_id: Optional[str] = None
    aging_buckets: Dict[str, Any] = Field(default_factory=dict)  # 0-30, 31-60, 61-90, 90+ days
