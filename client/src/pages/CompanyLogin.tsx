import { Building2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompanyLogin() {
  const { toast } = useToast();

  const handleReplitLogin = () => {
    // Redirect to Replit OAuth login
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-chart-1/10 to-chart-2/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl" data-testid="login-title">
                Sign In
              </CardTitle>
              <CardDescription data-testid="login-description">
                Sign in to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Sign in with your Replit account to access the Curacao Travel Planner
              </p>
            </div>
            
            <Button
              onClick={handleReplitLogin}
              className="w-full"
              size="lg"
              data-testid="button-replit-login"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Sign in with Replit
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              You'll be redirected to Replit for authentication
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground" data-testid="footer-text">
              Corporate Wellness Platform powered by <span className="font-semibold text-foreground">Velitt</span>, <span className="font-semibold text-foreground">Digital Adventures</span> and <span className="font-semibold text-foreground">FDDK</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
