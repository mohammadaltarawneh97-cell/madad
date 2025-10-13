"""
Warehouse Management API Routes
Complete inventory management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone

from warehouse_models import *
from models import User
from server import get_current_user, db, serialize_datetime, deserialize_datetime

warehouse_router = APIRouter(prefix="/api/warehouse", tags=["Warehouse"])


# ============================================================================
# WAREHOUSE ROUTES
# ============================================================================

@warehouse_router.post("/warehouses", response_model=Warehouse)
async def create_warehouse(wh_data: WarehouseCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("warehouses", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    wh_obj = Warehouse(**wh_data.model_dump(), company_id=user.current_company_id)
    doc = wh_obj.model_dump()
    serialize_datetime(doc)
    await db.warehouses.insert_one(doc)
    return wh_obj

@warehouse_router.get("/warehouses", response_model=List[Warehouse])
async def get_warehouses(user: User = Depends(get_current_user)):
    if not user.has_permission("warehouses", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    whs = await db.warehouses.find({"company_id": user.current_company_id}, {"_id": 0}).to_list(1000)
    for wh in whs:
        deserialize_datetime(wh, ['created_at', 'updated_at'])
    return whs


# ============================================================================
# PRODUCTS ROUTES
# ============================================================================

@warehouse_router.post("/products", response_model=Product)
async def create_product(prod_data: ProductCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("products", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    existing = await db.products.find_one({"company_id": user.current_company_id, "product_code": prod_data.product_code})
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    prod_obj = Product(**prod_data.model_dump(), company_id=user.current_company_id)
    doc = prod_obj.model_dump()
    serialize_datetime(doc)
    await db.products.insert_one(doc)
    return prod_obj

@warehouse_router.get("/products", response_model=List[Product])
async def get_products(
    product_type: Optional[ProductType] = None,
    is_active: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    if not user.has_permission("products", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    query = {"company_id": user.current_company_id}
    if product_type:
        query["product_type"] = product_type
    if is_active is not None:
        query["is_active"] = is_active
    
    prods = await db.products.find(query, {"_id": 0}).sort("product_code", 1).to_list(1000)
    for prod in prods:
        deserialize_datetime(prod, ['created_at', 'updated_at'])
    return prods


# ============================================================================
# STOCK BALANCE ROUTES
# ============================================================================

@warehouse_router.get("/stock-balance", response_model=List[StockBalance])
async def get_stock_balance(
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.has_permission("stock_balance", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    query = {"company_id": user.current_company_id}
    if warehouse_id:
        query["warehouse_id"] = warehouse_id
    if product_id:
        query["product_id"] = product_id
    
    balances = await db.stock_balance.find(query, {"_id": 0}).to_list(1000)
    for bal in balances:
        deserialize_datetime(bal, ['last_movement_date', 'created_at', 'updated_at'])
    return balances


# ============================================================================
# STOCK MOVEMENTS ROUTES
# ============================================================================

@warehouse_router.post("/stock-movements", response_model=StockMovement)
async def create_stock_movement(mov_data: StockMovementCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("stock_movements", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    # Get product info
    product = await db.products.find_one({"id": mov_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    count = await db.stock_movements.count_documents({"company_id": user.current_company_id})
    movement_number = f"MOV-{count + 1:06d}"
    
    total_cost = mov_data.quantity * mov_data.unit_cost
    
    mov_obj = StockMovement(
        **mov_data.model_dump(),
        company_id=user.current_company_id,
        movement_number=movement_number,
        product_code=product['product_code'],
        product_name=product['product_name'],
        total_cost=total_cost,
        created_by=user.username
    )
    
    doc = mov_obj.model_dump()
    serialize_datetime(doc)
    await db.stock_movements.insert_one(doc)
    
    # Update stock balance
    await update_stock_balance(mov_obj)
    
    return mov_obj

@warehouse_router.get("/stock-movements", response_model=List[StockMovement])
async def get_stock_movements(
    movement_type: Optional[MovementType] = None,
    product_id: Optional[str] = None,
    warehouse_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.has_permission("stock_movements", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    query = {"company_id": user.current_company_id}
    if movement_type:
        query["movement_type"] = movement_type
    if product_id:
        query["product_id"] = product_id
    if warehouse_id:
        query["$or"] = [{"from_warehouse_id": warehouse_id}, {"to_warehouse_id": warehouse_id}]
    
    movs = await db.stock_movements.find(query, {"_id": 0}).sort("movement_date", -1).to_list(1000)
    for mov in movs:
        deserialize_datetime(mov, ['movement_date', 'created_at', 'updated_at'])
    return movs

async def update_stock_balance(movement: StockMovement):
    """Helper function to update stock balance after movement"""
    if movement.movement_type == MovementType.RECEIPT:
        # Increase stock in TO warehouse
        await db.stock_balance.update_one(
            {"company_id": movement.company_id, "product_id": movement.product_id, "warehouse_id": movement.to_warehouse_id},
            {
                "$inc": {"quantity_on_hand": movement.quantity, "quantity_available": movement.quantity},
                "$set": {"last_movement_date": datetime.now(timezone.utc).isoformat(), "unit_cost": movement.unit_cost}
            },
            upsert=True
        )
    elif movement.movement_type == MovementType.ISSUE:
        # Decrease stock in FROM warehouse
        await db.stock_balance.update_one(
            {"company_id": movement.company_id, "product_id": movement.product_id, "warehouse_id": movement.from_warehouse_id},
            {
                "$inc": {"quantity_on_hand": -movement.quantity, "quantity_available": -movement.quantity},
                "$set": {"last_movement_date": datetime.now(timezone.utc).isoformat()}
            }
        )


# ============================================================================
# PURCHASE ORDERS ROUTES
# ============================================================================

@warehouse_router.post("/purchase-orders", response_model=PurchaseOrder)
async def create_purchase_order(po_data: PurchaseOrderCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("purchase_orders", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    # Get vendor
    vendor = await db.vendors.find_one({"id": po_data.vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get warehouse
    warehouse = await db.warehouses.find_one({"id": po_data.warehouse_id})
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    count = await db.purchase_orders.count_documents({"company_id": user.current_company_id})
    po_number = f"PO-{count + 1:06d}"
    
    subtotal = sum(line.total_amount for line in po_data.lines)
    tax_amount = sum(line.tax_amount for line in po_data.lines)
    total_amount = subtotal + tax_amount
    
    po_obj = PurchaseOrder(
        **po_data.model_dump(),
        company_id=user.current_company_id,
        po_number=po_number,
        vendor_name=vendor['vendor_name'],
        warehouse_name=warehouse['warehouse_name'],
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        created_by=user.username
    )
    
    doc = po_obj.model_dump()
    serialize_datetime(doc)
    await db.purchase_orders.insert_one(doc)
    return po_obj

@warehouse_router.get("/purchase-orders", response_model=List[PurchaseOrder])
async def get_purchase_orders(
    status: Optional[POStatus] = None,
    vendor_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    if not user.has_permission("purchase_orders", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if vendor_id:
        query["vendor_id"] = vendor_id
    
    pos = await db.purchase_orders.find(query, {"_id": 0}).sort("po_date", -1).to_list(1000)
    for po in pos:
        deserialize_datetime(po, ['po_date', 'expected_delivery_date', 'approved_date', 'created_at', 'updated_at'])
    return pos


# ============================================================================
# STOCK ADJUSTMENTS ROUTES
# ============================================================================

@warehouse_router.post("/stock-adjustments", response_model=StockAdjustment)
async def create_stock_adjustment(adj_data: StockAdjustmentCreate, user: User = Depends(get_current_user)):
    if not user.has_permission("stock_adjustments", "create"):
        raise HTTPException(status_code=403, detail="No permission")
    
    product = await db.products.find_one({"id": adj_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get current stock
    stock_bal = await db.stock_balance.find_one({
        "company_id": user.current_company_id,
        "product_id": adj_data.product_id,
        "warehouse_id": adj_data.warehouse_id
    })
    
    qty_before = stock_bal['quantity_on_hand'] if stock_bal else 0.0
    qty_after = qty_before + adj_data.quantity_adjusted
    unit_cost = stock_bal['unit_cost'] if stock_bal else product['unit_cost']
    
    count = await db.stock_adjustments.count_documents({"company_id": user.current_company_id})
    adj_number = f"ADJ-{count + 1:06d}"
    
    adj_obj = StockAdjustment(
        **adj_data.model_dump(),
        company_id=user.current_company_id,
        adjustment_number=adj_number,
        product_code=product['product_code'],
        product_name=product['product_name'],
        quantity_before=qty_before,
        quantity_after=qty_after,
        unit_cost=unit_cost,
        adjustment_value=adj_data.quantity_adjusted * unit_cost,
        created_by=user.username
    )
    
    doc = adj_obj.model_dump()
    serialize_datetime(doc)
    await db.stock_adjustments.insert_one(doc)
    
    # Update stock balance
    await db.stock_balance.update_one(
        {"company_id": user.current_company_id, "product_id": adj_data.product_id, "warehouse_id": adj_data.warehouse_id},
        {
            "$inc": {"quantity_on_hand": adj_data.quantity_adjusted, "quantity_available": adj_data.quantity_adjusted},
            "$set": {"last_movement_date": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return adj_obj

@warehouse_router.get("/stock-adjustments", response_model=List[StockAdjustment])
async def get_stock_adjustments(user: User = Depends(get_current_user)):
    if not user.has_permission("stock_adjustments", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    adjs = await db.stock_adjustments.find({"company_id": user.current_company_id}, {"_id": 0}).sort("adjustment_date", -1).to_list(1000)
    for adj in adjs:
        deserialize_datetime(adj, ['adjustment_date', 'created_at', 'updated_at'])
    return adjs


# ============================================================================
# REPORTS
# ============================================================================

@warehouse_router.get("/reports/stock-valuation")
async def get_stock_valuation_report(warehouse_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if not user.has_permission("reports", "read"):
        raise HTTPException(status_code=403, detail="No permission")
    
    query = {"company_id": user.current_company_id}
    if warehouse_id:
        query["warehouse_id"] = warehouse_id
    
    balances = await db.stock_balance.find(query, {"_id": 0}).to_list(1000)
    
    total_value = 0.0
    items = []
    for bal in balances:
        value = bal['quantity_on_hand'] * bal['unit_cost']
        total_value += value
        items.append({
            "product_code": bal['product_code'],
            "product_name": bal['product_name'],
            "warehouse": bal['warehouse_name'],
            "quantity": bal['quantity_on_hand'],
            "unit_cost": bal['unit_cost'],
            "total_value": value
        })
    
    return {
        "report_date": datetime.now(timezone.utc),
        "warehouse_id": warehouse_id,
        "items": items,
        "total_value": total_value
    }
