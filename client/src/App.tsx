import { Switch, Route } from "wouter";
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
        <Route component={Landing} />
      </Switch>
    );
  }

  // TODO: remove mock functionality - determine user type from real user data
  const isAdmin = user?.email?.includes('admin') || false;
  const userType = isAdmin ? 'admin' : 'company';

  return (
    <Switch>
      {userType === 'admin' ? (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/event-registration" component={EventRegistration} />
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
  
  // TODO: remove mock functionality - determine user type from real user data  
  const isAdmin = user?.email?.includes('admin') || false;
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

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isLoading || !isAuthenticated ? (
          <Router />
        ) : (
          <AuthenticatedApp />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
