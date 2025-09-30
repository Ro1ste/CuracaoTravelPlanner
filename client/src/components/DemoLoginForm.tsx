import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DemoLoginFormData {
  username: string;
  password: string;
  role: "company" | "admin";
}

export function DemoLoginForm() {
  const handleQuickLogin = (role: 'admin' | 'company') => {
    window.location.href = `/api/dev/login?role=${role}`;
  };

  return (
    <div className="space-y-4">
      <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          {/* <strong>DEV MODE</strong> - Quick login for testing (not secure) */}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg"
          onClick={() => handleQuickLogin('company')}
          data-testid="button-dev-login-company"
          className="min-w-[200px]"
        >
          Login as Company
        </Button>
        <Button 
          size="lg"
          variant="outline"
          onClick={() => handleQuickLogin('admin')}
          data-testid="button-dev-login-admin"
          className="min-w-[200px]"
        >
          Login as Admin
        </Button>
      </div>
    </div>
  );
}
