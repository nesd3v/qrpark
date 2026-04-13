import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GenerateQR from "./pages/GenerateQR";
import Notify from "./pages/Notify";
import Notifications from "./pages/Notifications";
import Auth from "./pages/Auth";
import Messages from "./pages/Messages";
import Scan from "./pages/Scan";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import Pricing from "./pages/Pricing";
import Install from "./pages/Install";
import Unsubscribe from "./pages/Unsubscribe";
import Subscription from "./pages/Subscription";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import HelpCenter from "./pages/HelpCenter";
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
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/install" element={<Install />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
