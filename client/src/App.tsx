import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Landing } from "@/pages/Landing";
import CompanySignup from "@/pages/CompanySignup";
import CompanyLogin from "@/pages/CompanyLogin";
import { CompanyDashboard } from "@/pages/CompanyDashboard";
import { CompanyLeaderboard } from "@/pages/CompanyLeaderboard";
import { CompanyEvents } from "@/pages/CompanyEvents";
import { CompanySettings } from "@/pages/CompanySettings";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { EventRegistration } from "@/pages/EventRegistration";
import { EventsManagement } from "@/pages/EventsManagement";
import { AttendeesManagement } from "@/pages/AttendeesManagement";
import CompaniesManagement from "@/pages/CompaniesManagement";
import AdministratorsManagement from "@/pages/AdministratorsManagement";
import { TasksManagement } from "@/pages/TasksManagement";
import { ProofReview } from "@/pages/ProofReview";
import { PasswordResetRequest } from "@/pages/PasswordResetRequest";
import { PasswordResetConfirm } from "@/pages/PasswordResetConfirm";
import { CheckInDisplay } from "@/pages/CheckInDisplay";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/signup" component={CompanySignup} />
        <Route path="/login" component={CompanyLogin} />
        <Route path="/password-reset" component={PasswordResetRequest} />
        <Route path="/reset-password" component={PasswordResetConfirm} />
        <Route path="/e/:shortCode" component={EventRegistration} />
        <Route path="/event-registration" component={EventRegistration} />
        <Route path="/event-registration/:eventId" component={EventRegistration} />
        <Route component={Landing} />
      </Switch>
    );
  }

  const isAdmin = user?.isAdmin || false;

  return (
    <Switch>
      {isAdmin ? (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/companies" component={CompaniesManagement} />
          <Route path="/tasks" component={TasksManagement} />
          <Route path="/administrators" component={AdministratorsManagement} />
          <Route path="/events" component={EventsManagement} />
          <Route path="/events/:eventId/attendees" component={AttendeesManagement} />
          <Route path="/admin/proofs/:proofId" component={ProofReview} />
        </>
      ) : (
        <>
          <Route path="/" component={CompanyDashboard} />
          <Route path="/leaderboard" component={CompanyLeaderboard} />
          <Route path="/events" component={CompanyEvents} />
          <Route path="/settings" component={CompanySettings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const userType = isAdmin ? 'admin' : 'company';
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      // Call logout API to clear the HTTP-only cookie
      await apiRequest("POST", "/api/logout");
      
      // Clear any cached data
      queryClient.clear();
      
      // Force page reload to clear all state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear cache and redirect anyway
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userType={userType} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h2 className="font-semibold text-lg" data-testid="app-title">
                  Curacao International Sports Week
                </h2>
                <p className="text-xs text-muted-foreground">Corporate Wellness Platform</p>
                <p className="text-sm text-muted-foreground" data-testid="user-info">
                  Welcome back, {user?.firstName || user?.email || 'User'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Event registration and check-in display pages should always render standalone
  const isEventRegistration = location.startsWith('/event-registration') || location.startsWith('/e/');
  const isCheckInDisplay = location.startsWith('/checkin-display/');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Always render event registration pages standalone (no sidebar/header)
  if (isEventRegistration) {
    return (
      <Switch>
        <Route path="/e/:shortCode" component={EventRegistration} />
        <Route path="/event-registration" component={EventRegistration} />
        <Route path="/event-registration/:eventId" component={EventRegistration} />
      </Switch>
    );
  }

  // Always render check-in display pages standalone (no sidebar/header)
  if (isCheckInDisplay) {
    return (
      <Switch>
        <Route path="/checkin-display/:eventId" component={CheckInDisplay} />
      </Switch>
    );
  }

  // For all other routes, use normal routing
  if (!isAuthenticated) {
    return <Router />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
