import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GenerateQR from "./pages/GenerateQR";
import Notify from "./pages/Notify";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import DashboardRouter from "./pages/DashboardRouter";
import ProfileRouter from "./pages/ProfileRouter";
import PricingRouter from "./pages/PricingRouter";
import AdminPanel from "./pages/AdminPanel";
import Install from "./pages/Install";
import Unsubscribe from "./pages/Unsubscribe";
import CorporateContact from "./pages/CorporateContact";
import CorporateDashboard from "./pages/CorporateDashboard";
import Subscription from "./pages/Subscription";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Kvkk from "./pages/Kvkk";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import SupportChatWidget from "./components/shared/SupportChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/generate" element={<GenerateQR />} />
          <Route path="/notify/:plateId" element={<Notify />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/profile" element={<ProfileRouter />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/pricing" element={<PricingRouter />} />
          <Route path="/install" element={<Install />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/corporate-contact" element={<CorporateContact />} />
          <Route path="/corporate" element={<CorporateDashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/kvkk" element={<Kvkk />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
