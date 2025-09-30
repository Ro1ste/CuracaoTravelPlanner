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
  const [role, setRole] = useState<"company" | "admin">("company");
  
  const form = useForm<DemoLoginFormData>({
    defaultValues: {
      username: "",
      password: "",
      role: "company",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: DemoLoginFormData) => {
      await apiRequest("POST", "/api/demo/login", data);
    },
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    loginMutation.mutate({ ...data, role });
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Demo Login</CardTitle>
        <CardDescription>
          Enter any username and password to test the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>DEMO MODE - NOT SECURE</strong>
            <br />
            This accepts any credentials for testing only
          </AlertDescription>
        </Alert>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              data-testid="input-username"
              placeholder="Enter any username"
              {...form.register("username", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              data-testid="input-password"
              placeholder="Enter any password"
              {...form.register("password", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Login As</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={role === "company" ? "default" : "outline"}
                onClick={() => setRole("company")}
                data-testid="button-role-company"
                className="flex-1"
              >
                Company
              </Button>
              <Button
                type="button"
                variant={role === "admin" ? "default" : "outline"}
                onClick={() => setRole("admin")}
                data-testid="button-role-admin"
                className="flex-1"
              >
                Admin
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
