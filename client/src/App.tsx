import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Landing } from "@/pages/Landing";
import { CompanyDashboard } from "@/pages/CompanyDashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { EventRegistration } from "@/pages/EventRegistration";
import { EventsManagement } from "@/pages/EventsManagement";
import { AttendeesManagement } from "@/pages/AttendeesManagement";
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
          <Route path="/events" component={EventsManagement} />
          <Route path="/events/:eventId/attendees" component={AttendeesManagement} />
        </>
      ) : (
        <>
          <Route path="/" component={CompanyDashboard} />
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
                  Corporate Wellness Platform
                </h2>
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

  // Event registration pages should always render standalone
  const isEventRegistration = location.startsWith('/event-registration');

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
        <Route path="/event-registration" component={EventRegistration} />
        <Route path="/event-registration/:eventId" component={EventRegistration} />
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
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
