import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Building2, Mail, Phone, Users } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface CompanyWithUser {
  id: string;
  name: string;
  contactPersonName: string;
  email: string;
  phone: string;
  teamSize: number | null;
  totalPoints: number | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function CompaniesManagement() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: companies, isLoading } = useQuery<CompanyWithUser[]>({
    queryKey: ['/api/admin/companies'],
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ companyId, password }: { companyId: string; password: string }) => {
      return await apiRequest('PATCH', `/api/admin/companies/${companyId}/password`, { password });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Company password has been successfully updated.",
      });
      setSelectedCompany(null);
      setNewPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePassword = () => {
    if (!selectedCompany) return;

    if (newPassword.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({
      companyId: selectedCompany.id,
      password: newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Companies Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage company accounts and reset passwords
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Companies: <span className="font-semibold">{companies?.length || 0}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Registered Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Team Size</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.map((company) => (
                  <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {company.name}
                      </div>
                    </TableCell>
                    <TableCell>{company.contactPersonName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {company.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {company.phone}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {company.teamSize || 1}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {company.totalPoints || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompany(company)}
                        data-testid={`button-reset-password-${company.id}`}
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {companies?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No companies registered yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCompany} onOpenChange={() => {
        setSelectedCompany(null);
        setNewPassword("");
        setConfirmPassword("");
      }}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle>Reset Company Password</DialogTitle>
            <DialogDescription>
              Update the password for <strong>{selectedCompany?.name}</strong>. The company will need to use the new password to log in.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-info">Company Information</Label>
              <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                <div><strong>Name:</strong> {selectedCompany?.name}</div>
                <div><strong>Contact:</strong> {selectedCompany?.contactPersonName}</div>
                <div><strong>Email:</strong> {selectedCompany?.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCompany(null);
                setNewPassword("");
                setConfirmPassword("");
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending}
              data-testid="button-update-password"
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
