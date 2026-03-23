import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Archive from "./pages/Archive.tsx";
import Browse from "./pages/Browse.tsx";
import MartyrProfile from "./pages/MartyrProfile.tsx";
import Contributors from "./pages/Contributors.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Admin from "./pages/Admin.tsx";
import AdminReview from "./pages/AdminReview.tsx";
import Install from "./pages/Install.tsx";
import OrgOnboarding from "./pages/OrgOnboarding.tsx";
import EditRecord from "./pages/EditRecord.tsx";
import NotFound from "./pages/NotFound.tsx";
import Contribute from "./pages/Contribute.tsx";
import ModeratorDashboard from "./pages/ModeratorDashboard.tsx";
import Stories from "./pages/Stories.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/martyr/:slug" element={<MartyrProfile />} />
              <Route path="/contributors" element={<Contributors />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin" element={
                <ProtectedRoute require="admin"><Admin /></ProtectedRoute>
              } />
              <Route path="/admin/review" element={
                <ProtectedRoute require="admin"><AdminReview /></ProtectedRoute>
              } />
              <Route path="/admin/edit/:slug" element={
                <ProtectedRoute require="admin"><EditRecord /></ProtectedRoute>
              } />
              <Route path="/install" element={<Install />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/org/start" element={
                <ProtectedRoute require="contributor"><OrgOnboarding /></ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <MobileBottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
