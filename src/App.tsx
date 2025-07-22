
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./components/auth/AuthPage";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import EmployeeProfilePage from "./components/employee/EmployeeProfilePage";
import IDPDetailPage from "./components/employee/IDPDetailPage";
import EmployeeIDPPage from "./components/employee/EmployeeIDPPage";
import NotificationSettings from "./components/employee/NotificationSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="elevate-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="/employee-profile/:employeeId" element={<EmployeeProfilePage />} />
            <Route path="/employee-profile/:employeeId/idp/:idpId" element={<IDPDetailPage />} />
            <Route path="/employee/idp/:idpId" element={<EmployeeIDPPage />} />
            <Route path="/employee/notifications" element={<NotificationSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
