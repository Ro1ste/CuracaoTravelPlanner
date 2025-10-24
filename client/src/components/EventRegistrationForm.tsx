import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EventRegistrationFormProps {
  eventTitle: string;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  }) => void;
  isSubmitting?: boolean;
}

export function EventRegistrationForm({ 
  eventTitle, 
  onSubmit, 
  isSubmitting = false 
}: EventRegistrationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: ""
  });
  const wasSubmitting = useRef(false);

  // Reset form after successful submission
  useEffect(() => {
    if (wasSubmitting.current && !isSubmitting) {
      // Submission completed, reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: ""
      });
    }
    wasSubmitting.current = isSubmitting;
  }, [isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    console.log('Event registration submitted:', formData);
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle data-testid="form-title" className="text-2xl">Register for Event</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Fill out the form below to register for {eventTitle}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                placeholder="John"
                required
                data-testid="input-first-name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                placeholder="Doe"
                required
                data-testid="input-last-name"
                className="h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              placeholder="john.doe@company.com"
              required
              data-testid="input-email"
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              placeholder="+1 (555) 123-4567"
              required
              data-testid="input-phone"
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Company Name (Optional)
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={handleInputChange("companyName")}
              placeholder="Your Company"
              data-testid="input-company-name"
              className="h-11"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium mt-6"
            disabled={isSubmitting}
            data-testid="button-register-event"
          >
            {isSubmitting ? "Registering..." : "Register for Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}