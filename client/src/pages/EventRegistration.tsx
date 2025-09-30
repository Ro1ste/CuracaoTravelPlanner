import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Event } from "@shared/schema";
import fddkLogo from "@assets/FDDK_1759241722627.png";

export function EventRegistration() {
  const { toast } = useToast();
  
  // Get event ID from URL parameter
  const [match, params] = useRoute("/event-registration/:eventId");
  const eventId = params?.eventId;

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Find specific event by ID
  const event = eventId 
    ? events.find(e => e.id === eventId) 
    : events[0];

  const registerMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      companyName?: string;
    }) => {
      if (!event?.id) throw new Error("No event available");
      
      const res = await apiRequest("POST", `/api/events/${event.id}/register`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted!",
        description: "Thank you for registering! Your registration is pending approval. You'll receive a confirmation email with your QR code once approved.",
      });
      // Invalidate events query to refresh stats
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEventRegistration = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  }) => {
    registerMutation.mutate(data);
  };

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground">
              This event is not available or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Simple Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={fddkLogo} 
                alt="FDDK Logo" 
                className="h-16 w-auto"
                data-testid="logo-fddk"
              />
              <div className="border-l pl-3">
                <h1 className="font-semibold text-base" data-testid="nav-title">
                  Event Registration
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content - Event Info and Registration Form */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Information */}
            <div className="space-y-6">
              <div>
                <Badge 
                  variant="outline" 
                  className="mb-4"
                  style={{ 
                    borderColor: event.brandingColor || "#ff6600",
                    color: event.brandingColor || "#ff6600"
                  }}
                >
                  Event Details
                </Badge>
                
                <h1 className="text-4xl font-bold mb-4" data-testid="event-title">
                  {event.title}
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed mb-6" data-testid="event-description">
                  {event.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5" style={{ color: event.brandingColor || "#ff6600" }} />
                    <span className="text-base" data-testid="event-date">
                      {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date To Be Announced'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Event Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What to Expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Submit your registration through this form</p>
                  <p>✓ Your registration will be reviewed by our team</p>
                  <p>✓ Once approved, you'll receive an email with your QR code</p>
                  <p>✓ Present your QR code at the event for check-in</p>
                </CardContent>
              </Card>
            </div>

            {/* Registration Form */}
            <div>
              <EventRegistrationForm
                eventTitle={event.title}
                eventDescription={event.description ?? ""}
                onSubmit={handleEventRegistration}
                isSubmitting={registerMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 FDDK Corporate Wellness Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
