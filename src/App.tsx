import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import CompaniesPage from "./pages/CompaniesPage";
import SalariesPage from "./pages/SalariesPage";
import RankingsPage from "./pages/RankingsPage";
import PricingPage from "./pages/PricingPage";
import BlogPage from "./pages/BlogPage";
import CareersPage from "./pages/CareersPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFoundPage from "./pages/NotFoundPage";
import CandidateDashboard from "./pages/CandidateDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vagas" element={<JobsPage />} />
          <Route path="/vagas/:id" element={<JobDetailPage />} />
          <Route path="/empresas" element={<CompaniesPage />} />
          <Route path="/salarios" element={<SalariesPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/planos" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/carreiras" element={<CareersPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<SignupPage />} />
          <Route
            path="/candidato/*"
            element={
              <ProtectedRoute allowedTypes={["candidate"]}>
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/*"
            element={
              <ProtectedRoute allowedTypes={["company"]}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedTypes={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <PWAInstallPrompt />
    </div>
  );
}
