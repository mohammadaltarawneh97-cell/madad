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
              <DashboardLayout>
                <RoleDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/companies" element={
            <ProtectedRoute>
              <DashboardLayout>
                <CompanyManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/equipment" element={
            <ProtectedRoute>
              <DashboardLayout>
                <EquipmentManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/production" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProductionManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpenseManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvoiceManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AttendanceManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProjectManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/feasibility-studies" element={
            <ProtectedRoute>
              <DashboardLayout>
                <FeasibilityStudyTracker />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/investments" element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvestmentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/financial-projections" element={
            <ProtectedRoute>
              <DashboardLayout>
                <FinancialProjections />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/org-chart" element={
            <ProtectedRoute>
              <DashboardLayout>
                <OrganizationalChart />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Accounting Routes */}
          <Route path="/accounting" element={
            <ProtectedRoute>
              <DashboardLayout>
                <AccountingDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/chart-of-accounts" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ChartOfAccounts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/general-ledger" element={
            <ProtectedRoute>
              <DashboardLayout>
                <GeneralLedger />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/vendors" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Vendors />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/vendor-bills" element={
            <ProtectedRoute>
              <DashboardLayout>
                <VendorBills />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/customers" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/ar-invoices" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ARInvoices />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/fixed-assets" element={
            <ProtectedRoute>
              <DashboardLayout>
                <FixedAssets />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/reports" element={
            <ProtectedRoute>
              <DashboardLayout>
                <FinancialReports />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/bank-reconciliation" element={
            <ProtectedRoute>
              <DashboardLayout>
                <BankReconciliation />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/expense-claims" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ExpenseClaims />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/budgets" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Budgets />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/accounting/payment-batches" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PaymentBatches />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* CRM Routes */}
          <Route path="/crm" element={
            <ProtectedRoute>
              <DashboardLayout>
                <CRMDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/leads" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Leads />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/accounts" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Accounts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/contacts" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Contacts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/opportunities" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Opportunities />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/cases" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Cases />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/campaigns" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Campaigns />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/tasks" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/activities" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Activities />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/products" element={
            <ProtectedRoute>
              <DashboardLayout>
                <CRMProducts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/contracts" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Contracts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/email-templates" element={
            <ProtectedRoute>
              <DashboardLayout>
                <EmailTemplates />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/crm/forecasting" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Forecasting />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Warehouse Routes */}
          <Route path="/warehouse" element={
            <ProtectedRoute>
              <DashboardLayout>
                <WarehouseDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/products" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/stock-balance" element={
            <ProtectedRoute>
              <DashboardLayout>
                <StockBalance />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/warehouses" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Warehouses />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/stock-movements" element={
            <ProtectedRoute>
              <DashboardLayout>
                <StockMovements />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/purchase-orders" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PurchaseOrders />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/warehouse/inventory-transfers" element={
            <ProtectedRoute>
              <DashboardLayout>
                <InventoryTransfers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;