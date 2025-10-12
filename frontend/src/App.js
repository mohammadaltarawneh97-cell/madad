import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Import multi-company components
import { 
  AppProvider, 
  ProtectedRoute, 
  DashboardLayout, 
  Login, 
  CompanyManagement 
} from "./components/MultiCompanyApp";

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
import DriverDashboard from './components/DriverDashboard';

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
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;