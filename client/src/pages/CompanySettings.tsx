import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Building2, Mail, Phone, User } from "lucide-react";

interface Company {
  id: string;
  name: string;
  contactPersonName: string;
  email: string;
  phone: string;
  logoUrl: string | null;
  brandingColor: string;
}

export function CompanySettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      return await apiRequest("PATCH", `/api/companies/${company?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", user?.companyId] });
      toast({
        title: "Success",
        description: "Company profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      name: formData.get("name") as string,
      contactPersonName: formData.get("contactPersonName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Company profile not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Company Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={company.name}
                  disabled={!isEditing}
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonName">
                  <User className="h-4 w-4 inline mr-2" />
                  Contact Person
                </Label>
                <Input
                  id="contactPersonName"
                  name="contactPersonName"
                  defaultValue={company.contactPersonName}
                  disabled={!isEditing}
                  data-testid="input-contact-person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={company.email}
                  disabled={!isEditing}
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={company.phone}
                  disabled={!isEditing}
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit"
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
