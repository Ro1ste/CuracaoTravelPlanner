import { Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginForm() {
  const handleReplitLogin = () => {
    // Redirect to Replit OAuth login
    window.location.href = "/api/login";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Company Login</CardTitle>
        <CardDescription>Sign in with your Replit account to access the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              You'll be redirected to Replit for authentication
            </p>
          </div>
          
          <Button
            onClick={handleReplitLogin}
            className="w-full"
            size="lg"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Sign in with Replit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}