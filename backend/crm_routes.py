"""
Salesforce-like CRM API Routes
Complete CRM endpoints for Leads, Accounts, Contacts, Opportunities, Cases, and Campaigns
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import csv
import io

from crm_models import *
from models import User, UserRole
from server import get_current_user, db, serialize_datetime, deserialize_datetime

# Create CRM router
crm_router = APIRouter(prefix="/api/crm", tags=["CRM"])


# ============================================================================
# LEAD MANAGEMENT ROUTES
# ============================================================================

@crm_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate, user: User = Depends(get_current_user)):
    """Create a new lead"""
    if not user.has_permission("leads", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create leads")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Generate lead number
    count = await db.leads.count_documents({"company_id": user.current_company_id})
    lead_number = f"LEAD-{count + 1:06d}"
    
    # Create full name
    full_name = f"{lead_data.first_name} {lead_data.last_name}"
    
    lead_obj = Lead(
        **lead_data.model_dump(),
        company_id=user.current_company_id,
        lead_number=lead_number,
        full_name=full_name
    )
    
    doc = lead_obj.model_dump()
    serialize_datetime(doc)
    
    await db.leads.insert_one(doc)
    return lead_obj

@crm_router.get("/leads", response_model=List[Lead])
async def get_leads(
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    assigned_to: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get leads list"""
    if not user.has_permission("leads", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view leads")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    leads_list = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for lead in leads_list:
        deserialize_datetime(lead, ['created_at', 'updated_at', 'expected_close_date', 'converted_date', 'last_contacted', 'next_follow_up'])
    
    return leads_list

@crm_router.post("/leads/{lead_id}/convert")
async def convert_lead(lead_id: str, user: User = Depends(get_current_user)):
    """Convert lead to Account, Contact, and Opportunity"""
    if not user.has_permission("leads", "convert"):
        raise HTTPException(status_code=403, detail="You don't have permission to convert leads")
    
    lead_doc = await db.leads.find_one({"id": lead_id, "company_id": user.current_company_id})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc.get('is_converted'):
        raise HTTPException(status_code=400, detail="Lead already converted")
    
    # Create Account
    account_count = await db.crm_accounts.count_documents({"company_id": user.current_company_id})
    account = Account(
        company_id=user.current_company_id,
        account_number=f"ACC-{account_count + 1:06d}",
        account_name=lead_doc.get('company') or lead_doc['full_name'],
        phone=lead_doc.get('phone'),
        email=lead_doc.get('email'),
        account_type=AccountType.PROSPECT,
        owner_id=user.id,
        owner_name=user.full_name
    )
    account_dict = account.model_dump()
    serialize_datetime(account_dict)
    await db.crm_accounts.insert_one(account_dict)
    
    # Create Contact
    contact_count = await db.crm_contacts.count_documents({"company_id": user.current_company_id})
    contact = Contact(
        company_id=user.current_company_id,
        contact_number=f"CON-{contact_count + 1:06d}",
        account_id=account.id,
        account_name=account.account_name,
        first_name=lead_doc['first_name'],
        last_name=lead_doc['last_name'],
        full_name=lead_doc['full_name'],
        email=lead_doc['email'],
        phone=lead_doc.get('phone'),
        mobile=lead_doc.get('mobile'),
        is_primary=True,
        owner_id=user.id,
        owner_name=user.full_name
    )
    contact_dict = contact.model_dump()
    serialize_datetime(contact_dict)
    await db.crm_contacts.insert_one(contact_dict)
    
    # Create Opportunity if estimated value exists
    opportunity_id = None
    if lead_doc.get('estimated_value'):
        opp_count = await db.opportunities.count_documents({"company_id": user.current_company_id})
        opportunity = Opportunity(
            company_id=user.current_company_id,
            opportunity_number=f"OPP-{opp_count + 1:06d}",
            opportunity_name=f"Opportunity - {lead_doc['full_name']}",
            account_id=account.id,
            account_name=account.account_name,
            contact_id=contact.id,
            contact_name=contact.full_name,
            amount=lead_doc['estimated_value'],
            close_date=lead_doc.get('expected_close_date') or datetime.now(timezone.utc) + timedelta(days=30),
            stage=OpportunityStage.QUALIFICATION,
            probability=25,
            owner_id=user.id,
            owner_name=user.full_name
        )
        opp_dict = opportunity.model_dump()
        serialize_datetime(opp_dict)
        await db.opportunities.insert_one(opp_dict)
        opportunity_id = opportunity.id
    
    # Update lead as converted
    await db.leads.update_one(
        {"id": lead_id},
        {"$set": {
            "is_converted": True,
            "status": LeadStatus.CONVERTED,
            "converted_date": datetime.now(timezone.utc).isoformat(),
            "converted_account_id": account.id,
            "converted_contact_id": contact.id,
            "converted_opportunity_id": opportunity_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": "Lead converted successfully",
        "account_id": account.id,
        "contact_id": contact.id,
        "opportunity_id": opportunity_id
    }


# ============================================================================
# ACCOUNTS ROUTES
# ============================================================================

@crm_router.post("/accounts", response_model=Account)
async def create_account(account_data: AccountCreate, user: User = Depends(get_current_user)):
    """Create a new account"""
    if not user.has_permission("crm_accounts", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create accounts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    count = await db.crm_accounts.count_documents({"company_id": user.current_company_id})
    account_number = f"ACC-{count + 1:06d}"
    
    account_obj = Account(
        **account_data.model_dump(),
        company_id=user.current_company_id,
        account_number=account_number
    )
    
    doc = account_obj.model_dump()
    serialize_datetime(doc)
    
    await db.crm_accounts.insert_one(doc)
    return account_obj

@crm_router.get("/accounts", response_model=List[Account])
async def get_accounts(
    account_type: Optional[AccountType] = None,
    is_active: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    """Get accounts list"""
    if not user.has_permission("crm_accounts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view accounts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if account_type:
        query["account_type"] = account_type
    if is_active is not None:
        query["is_active"] = is_active
    
    accounts_list = await db.crm_accounts.find(query, {"_id": 0}).sort("account_name", 1).to_list(1000)
    
    for account in accounts_list:
        deserialize_datetime(account, ['created_at', 'updated_at'])
    
    return accounts_list


# ============================================================================
# CONTACTS ROUTES
# ============================================================================

@crm_router.post("/contacts", response_model=Contact)
async def create_contact(contact_data: ContactCreate, user: User = Depends(get_current_user)):
    """Create a new contact"""
    if not user.has_permission("crm_contacts", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create contacts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get account name
    account = await db.crm_accounts.find_one({"id": contact_data.account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    count = await db.crm_contacts.count_documents({"company_id": user.current_company_id})
    contact_number = f"CON-{count + 1:06d}"
    
    full_name = f"{contact_data.first_name} {contact_data.last_name}"
    
    contact_obj = Contact(
        **contact_data.model_dump(),
        company_id=user.current_company_id,
        contact_number=contact_number,
        account_name=account['account_name'],
        full_name=full_name
    )
    
    doc = contact_obj.model_dump()
    serialize_datetime(doc)
    
    await db.crm_contacts.insert_one(doc)
    return contact_obj

@crm_router.get("/contacts", response_model=List[Contact])
async def get_contacts(
    account_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    """Get contacts list"""
    if not user.has_permission("crm_contacts", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view contacts")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if account_id:
        query["account_id"] = account_id
    if is_active is not None:
        query["is_active"] = is_active
    
    contacts_list = await db.crm_contacts.find(query, {"_id": 0}).sort("last_name", 1).to_list(1000)
    
    for contact in contacts_list:
        deserialize_datetime(contact, ['created_at', 'updated_at', 'date_of_birth'])
    
    return contacts_list


# ============================================================================
# OPPORTUNITIES ROUTES
# ============================================================================

@crm_router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(opp_data: OpportunityCreate, user: User = Depends(get_current_user)):
    """Create a new opportunity"""
    if not user.has_permission("opportunities", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create opportunities")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    # Get account name
    account = await db.crm_accounts.find_one({"id": opp_data.account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    count = await db.opportunities.count_documents({"company_id": user.current_company_id})
    opp_number = f"OPP-{count + 1:06d}"
    
    # Calculate expected revenue
    expected_revenue = opp_data.amount * (opp_data.probability / 100)
    
    opp_obj = Opportunity(
        **opp_data.model_dump(),
        company_id=user.current_company_id,
        opportunity_number=opp_number,
        account_name=account['account_name'],
        expected_revenue=expected_revenue
    )
    
    doc = opp_obj.model_dump()
    serialize_datetime(doc)
    
    await db.opportunities.insert_one(doc)
    return opp_obj

@crm_router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(
    stage: Optional[OpportunityStage] = None,
    account_id: Optional[str] = None,
    is_closed: Optional[bool] = None,
    user: User = Depends(get_current_user)
):
    """Get opportunities list"""
    if not user.has_permission("opportunities", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view opportunities")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if stage:
        query["stage"] = stage
    if account_id:
        query["account_id"] = account_id
    if is_closed is not None:
        query["is_closed"] = is_closed
    
    opps_list = await db.opportunities.find(query, {"_id": 0}).sort("close_date", 1).to_list(1000)
    
    for opp in opps_list:
        deserialize_datetime(opp, ['close_date', 'closed_date', 'created_at', 'updated_at'])
    
    return opps_list


# ============================================================================
# CASES ROUTES
# ============================================================================

@crm_router.post("/cases", response_model=Case)
async def create_case(case_data: CaseCreate, user: User = Depends(get_current_user)):
    """Create a new support case"""
    if not user.has_permission("cases", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create cases")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    count = await db.cases.count_documents({"company_id": user.current_company_id})
    case_number = f"CASE-{count + 1:06d}"
    
    case_obj = Case(
        **case_data.model_dump(),
        company_id=user.current_company_id,
        case_number=case_number,
        owner_id=user.id,
        owner_name=user.full_name
    )
    
    doc = case_obj.model_dump()
    serialize_datetime(doc)
    
    await db.cases.insert_one(doc)
    return case_obj

@crm_router.get("/cases", response_model=List[Case])
async def get_cases(
    status: Optional[CaseStatus] = None,
    priority: Optional[CasePriority] = None,
    account_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get cases list"""
    if not user.has_permission("cases", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view cases")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if account_id:
        query["account_id"] = account_id
    
    cases_list = await db.cases.find(query, {"_id": 0}).sort("opened_date", -1).to_list(1000)
    
    for case in cases_list:
        deserialize_datetime(case, ['opened_date', 'closed_date', 'response_due_date', 'resolution_due_date', 'escalated_date', 'created_at', 'updated_at'])
    
    return cases_list


# ============================================================================
# CAMPAIGNS ROUTES
# ============================================================================

@crm_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign_data: CampaignCreate, user: User = Depends(get_current_user)):
    """Create a new marketing campaign"""
    if not user.has_permission("campaigns", "create"):
        raise HTTPException(status_code=403, detail="You don't have permission to create campaigns")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    count = await db.campaigns.count_documents({"company_id": user.current_company_id})
    campaign_number = f"CAMP-{count + 1:06d}"
    
    campaign_obj = Campaign(
        **campaign_data.model_dump(),
        company_id=user.current_company_id,
        campaign_number=campaign_number
    )
    
    doc = campaign_obj.model_dump()
    serialize_datetime(doc)
    
    await db.campaigns.insert_one(doc)
    return campaign_obj

@crm_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns(
    status: Optional[CampaignStatus] = None,
    campaign_type: Optional[CampaignType] = None,
    user: User = Depends(get_current_user)
):
    """Get campaigns list"""
    if not user.has_permission("campaigns", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view campaigns")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    query = {"company_id": user.current_company_id}
    if status:
        query["status"] = status
    if campaign_type:
        query["campaign_type"] = campaign_type
    
    campaigns_list = await db.campaigns.find(query, {"_id": 0}).sort("start_date", -1).to_list(1000)
    
    for campaign in campaigns_list:
        deserialize_datetime(campaign, ['start_date', 'end_date', 'created_at', 'updated_at'])
    
    return campaigns_list


# ============================================================================
# SALES ANALYTICS & DASHBOARD
# ============================================================================

@crm_router.get("/dashboard/sales-analytics")
async def get_sales_analytics(user: User = Depends(get_current_user)):
    """Get CRM dashboard analytics"""
    if not user.has_permission("dashboard", "read"):
        raise HTTPException(status_code=403, detail="You don't have permission to view dashboard")
    
    if not hasattr(user, 'current_company_id') or not user.current_company_id:
        raise HTTPException(status_code=400, detail="No company context")
    
    company_id = user.current_company_id
    
    # Leads stats
    total_leads = await db.leads.count_documents({"company_id": company_id})
    new_leads = await db.leads.count_documents({"company_id": company_id, "status": LeadStatus.NEW})
    converted_leads = await db.leads.count_documents({"company_id": company_id, "is_converted": True})
    
    # Opportunities stats
    total_opportunities = await db.opportunities.count_documents({"company_id": company_id})
    open_opportunities = await db.opportunities.count_documents({"company_id": company_id, "is_closed": False})
    won_opportunities = await db.opportunities.count_documents({"company_id": company_id, "is_won": True})
    
    # Calculate pipeline value
    pipeline = await db.opportunities.find({"company_id": company_id, "is_closed": False}, {"amount": 1, "expected_revenue": 1}).to_list(1000)
    pipeline_value = sum(opp.get('amount', 0) for opp in pipeline)
    weighted_pipeline = sum(opp.get('expected_revenue', 0) for opp in pipeline)
    
    # Won deals revenue
    won_deals = await db.opportunities.find({"company_id": company_id, "is_won": True}, {"amount": 1}).to_list(1000)
    won_revenue = sum(deal.get('amount', 0) for deal in won_deals)
    
    # Accounts & Contacts
    total_accounts = await db.crm_accounts.count_documents({"company_id": company_id})
    total_contacts = await db.crm_contacts.count_documents({"company_id": company_id})
    
    # Cases stats
    total_cases = await db.cases.count_documents({"company_id": company_id})
    open_cases = await db.cases.count_documents({"company_id": company_id, "status": {"$in": [CaseStatus.NEW, CaseStatus.IN_PROGRESS]}})
    
    return {
        "leads": {
            "total": total_leads,
            "new": new_leads,
            "converted": converted_leads,
            "conversion_rate": (converted_leads / total_leads * 100) if total_leads > 0 else 0
        },
        "opportunities": {
            "total": total_opportunities,
            "open": open_opportunities,
            "won": won_opportunities,
            "win_rate": (won_opportunities / total_opportunities * 100) if total_opportunities > 0 else 0
        },
        "pipeline": {
            "total_value": pipeline_value,
            "weighted_value": weighted_pipeline,
            "won_revenue": won_revenue
        },
        "accounts": total_accounts,
        "contacts": total_contacts,
        "cases": {
            "total": total_cases,
            "open": open_cases
        }
    }
