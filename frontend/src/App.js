import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Import multi-company components
import { 
  AppProvider, 
  ProtectedRoute, 
  Login, 
  CompanyManagement,
  useApp 
} from "./components/MultiCompanyApp";

// Import New Shell Layout
import NewShell from "./components/NewShell";

// Import Advanced Dashboard
import AdvancedDashboard from './components/AdvancedDashboard';

// Import comprehensive management components
import ProductionManagement from './components/ProductionManagement';
import ExpenseManagement from './components/ExpenseManagement';
import InvoiceManagement from './components/InvoiceManagement';
import AttendanceManagement from './components/AttendanceManagement';

// Import new project management components
import ProjectManagement from './components/ProjectManagement';
import FeasibilityStudyTracker from './components/FeasibilityStudyTracker';
import InvestmentDashboard from './components/InvestmentDashboard';
import FinancialProjections from './components/FinancialProjections';
import OrganizationalChart from './components/OrganizationalChart';

// Import role-specific dashboards
import DriverDashboard from './components/DriverDashboard';
import GuardDashboard from './components/GuardDashboard';
import AccountantDashboard from './components/AccountantDashboard';
import ForemanDashboard from './components/ForemanDashboard';
import ManagerDashboard from './components/ManagerDashboard';

// Import accounting components
import AccountingDashboard from './components/accounting/AccountingDashboard';
import ChartOfAccounts from './components/accounting/ChartOfAccounts';
import GeneralLedger from './components/accounting/GeneralLedger';
import Vendors from './components/accounting/Vendors';
import VendorBills from './components/accounting/VendorBills';
import Customers from './components/accounting/Customers';
import ARInvoices from './components/accounting/ARInvoices';
import FixedAssets from './components/accounting/FixedAssets';
import FinancialReports from './components/accounting/FinancialReports';
import BankReconciliation from './components/accounting/BankReconciliation';
import ExpenseClaims from './components/accounting/ExpenseClaims';
import Budgets from './components/accounting/Budgets';
import PaymentBatches from './components/accounting/PaymentBatches';

// Import CRM components
import CRMDashboard from './components/crm/CRMDashboard';
import Leads from './components/crm/Leads';
import Accounts from './components/crm/Accounts';
import Contacts from './components/crm/Contacts';
import Opportunities from './components/crm/Opportunities';
import Cases from './components/crm/Cases';
import Campaigns from './components/crm/Campaigns';
import Tasks from './components/crm/Tasks';
import Activities from './components/crm/Activities';
import CRMProducts from './components/crm/CRMProducts';
import Contracts from './components/crm/Contracts';
import EmailTemplates from './components/crm/EmailTemplates';
import Forecasting from './components/crm/Forecasting';

// Import Warehouse components
import WarehouseDashboard from './components/warehouse/WarehouseDashboard';
import Products from './components/warehouse/Products';
import StockBalance from './components/warehouse/StockBalance';
import Warehouses from './components/warehouse/Warehouses';
import StockMovements from './components/warehouse/StockMovements';
import PurchaseOrders from './components/warehouse/PurchaseOrders';
import InventoryTransfers from './components/warehouse/InventoryTransfers';

// Import new production-focused pages
import Production from './pages/Production';
import EquipmentPage from './pages/EquipmentPage';
import CostingCenters from './pages/CostingCenters';
import InvoiceScreening from './pages/InvoiceScreening';
import InvoiceFeeding from './pages/InvoiceFeeding';
import InvoiceCrushing from './pages/InvoiceCrushing';
import InvoiceHauling from './pages/InvoiceHauling';
import ExpenseFuel from './pages/ExpenseFuel';
import ExpenseOil from './pages/ExpenseOil';
import ExpenseGrease from './pages/ExpenseGrease';
import ExpenseSpareParts from './pages/ExpenseSpareParts';
import ExpenseSalaries from './pages/ExpenseSalaries';
import ExpenseOthers from './pages/ExpenseOthers';
import ComplianceLicenses from './pages/ComplianceLicenses';
import ComplianceInsurance from './pages/ComplianceInsurance';
import ComplianceCertificates from './pages/ComplianceCertificates';
import MOUPage from './pages/MOUPage';
import FinancialsPage from './pages/FinancialsPage';
import HSEPage from './pages/HSEPage';

// Role-based Dashboard Component
const RoleDashboard = () => {
  const { userRole } = useApp();
  
  // Each role gets their own restricted dashboard
  if (userRole === 'driver') {
    return <DriverDashboard />;
  }
  
  if (userRole === 'guard') {
    return <GuardDashboard />;
  }
  
  if (userRole === 'accountant') {
    return <AccountantDashboard />;
  }
  
  if (userRole === 'foreman') {
    return <ForemanDashboard />;
  }
  
  if (userRole === 'manager') {
    return <ManagerDashboard />;
  }
  
  // Owner and SuperAdmin get the advanced dashboard with full access
  return <AdvancedDashboard />;
};

// Equipment Management Component (updated for multi-company)
const EquipmentManagement = () => {
  return <div>Equipment management will be here</div>;
};

// Main Multi-Company App Component
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <NewShell>
                <RoleDashboard />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/companies" element={
            <ProtectedRoute>
              <NewShell>
                <CompanyManagement />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Production Routes */}
          <Route path="/production" element={
            <ProtectedRoute>
              <NewShell>
                <Production />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/equipment" element={
            <ProtectedRoute>
              <NewShell>
                <EquipmentPage />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/costing-centers" element={
            <ProtectedRoute>
              <NewShell>
                <CostingCenters />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Invoice Routes */}
          <Route path="/invoices" element={
            <ProtectedRoute>
              <NewShell>
                <InvoiceManagement />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/invoices/screening" element={
            <ProtectedRoute>
              <NewShell>
                <InvoiceScreening />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/invoices/feeding" element={
            <ProtectedRoute>
              <NewShell>
                <InvoiceFeeding />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/invoices/crushing" element={
            <ProtectedRoute>
              <NewShell>
                <InvoiceCrushing />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/invoices/hauling" element={
            <ProtectedRoute>
              <NewShell>
                <InvoiceHauling />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Expense Routes */}
          <Route path="/expenses" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseManagement />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/fuel" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseFuel />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/oil" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseOil />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/grease" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseGrease />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/spare-parts" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseSpareParts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/salaries" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseSalaries />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/expenses/others" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseOthers />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Compliance Routes */}
          <Route path="/compliance/licenses" element={
            <ProtectedRoute>
              <NewShell>
                <ComplianceLicenses />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/compliance/insurance" element={
            <ProtectedRoute>
              <NewShell>
                <ComplianceInsurance />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/compliance/certificates" element={
            <ProtectedRoute>
              <NewShell>
                <ComplianceCertificates />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Document Routes */}
          <Route path="/mou" element={
            <ProtectedRoute>
              <NewShell>
                <MOUPage />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/financials" element={
            <ProtectedRoute>
              <NewShell>
                <FinancialsPage />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/hse" element={
            <ProtectedRoute>
              <NewShell>
                <HSEPage />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Legacy Routes */}
          <Route path="/attendance" element={
            <ProtectedRoute>
              <NewShell>
                <AttendanceManagement />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <NewShell>
                <ProjectManagement />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/feasibility-studies" element={
            <ProtectedRoute>
              <NewShell>
                <FeasibilityStudyTracker />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/investments" element={
            <ProtectedRoute>
              <NewShell>
                <InvestmentDashboard />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/financial-projections" element={
            <ProtectedRoute>
              <NewShell>
                <FinancialProjections />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/org-chart" element={
            <ProtectedRoute>
              <NewShell>
                <OrganizationalChart />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Accounting Routes */}
          <Route path="/accounting" element={
            <ProtectedRoute>
              <NewShell>
                <AccountingDashboard />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/chart-of-accounts" element={
            <ProtectedRoute>
              <NewShell>
                <ChartOfAccounts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/general-ledger" element={
            <ProtectedRoute>
              <NewShell>
                <GeneralLedger />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/vendors" element={
            <ProtectedRoute>
              <NewShell>
                <Vendors />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/vendor-bills" element={
            <ProtectedRoute>
              <NewShell>
                <VendorBills />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/customers" element={
            <ProtectedRoute>
              <NewShell>
                <Customers />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/ar-invoices" element={
            <ProtectedRoute>
              <NewShell>
                <ARInvoices />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/fixed-assets" element={
            <ProtectedRoute>
              <NewShell>
                <FixedAssets />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/reports" element={
            <ProtectedRoute>
              <NewShell>
                <FinancialReports />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/bank-reconciliation" element={
            <ProtectedRoute>
              <NewShell>
                <BankReconciliation />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/expense-claims" element={
            <ProtectedRoute>
              <NewShell>
                <ExpenseClaims />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/budgets" element={
            <ProtectedRoute>
              <NewShell>
                <Budgets />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/accounting/payment-batches" element={
            <ProtectedRoute>
              <NewShell>
                <PaymentBatches />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* CRM Routes */}
          <Route path="/crm" element={
            <ProtectedRoute>
              <NewShell>
                <CRMDashboard />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/leads" element={
            <ProtectedRoute>
              <NewShell>
                <Leads />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/accounts" element={
            <ProtectedRoute>
              <NewShell>
                <Accounts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/contacts" element={
            <ProtectedRoute>
              <NewShell>
                <Contacts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/opportunities" element={
            <ProtectedRoute>
              <NewShell>
                <Opportunities />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/cases" element={
            <ProtectedRoute>
              <NewShell>
                <Cases />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/campaigns" element={
            <ProtectedRoute>
              <NewShell>
                <Campaigns />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/tasks" element={
            <ProtectedRoute>
              <NewShell>
                <Tasks />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/activities" element={
            <ProtectedRoute>
              <NewShell>
                <Activities />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/products" element={
            <ProtectedRoute>
              <NewShell>
                <CRMProducts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/contracts" element={
            <ProtectedRoute>
              <NewShell>
                <Contracts />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/email-templates" element={
            <ProtectedRoute>
              <NewShell>
                <EmailTemplates />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/crm/forecasting" element={
            <ProtectedRoute>
              <NewShell>
                <Forecasting />
              </NewShell>
            </ProtectedRoute>
          } />
          
          {/* Warehouse Routes */}
          <Route path="/warehouse" element={
            <ProtectedRoute>
              <NewShell>
                <WarehouseDashboard />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/products" element={
            <ProtectedRoute>
              <NewShell>
                <Products />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/stock-balance" element={
            <ProtectedRoute>
              <NewShell>
                <StockBalance />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/warehouses" element={
            <ProtectedRoute>
              <NewShell>
                <Warehouses />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/stock-movements" element={
            <ProtectedRoute>
              <NewShell>
                <StockMovements />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/purchase-orders" element={
            <ProtectedRoute>
              <NewShell>
                <PurchaseOrders />
              </NewShell>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/inventory-transfers" element={
            <ProtectedRoute>
              <NewShell>
                <InventoryTransfers />
              </NewShell>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;