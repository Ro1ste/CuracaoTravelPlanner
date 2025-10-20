import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import type { Event, EventRegistration } from "@shared/schema";
import eiswLogo from "@/assets/eisw-logo.jpeg";

export function EventRegistration() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Try to match both short code and event ID routes
  const [matchShort, paramsShort] = useRoute("/e/:shortCode");
  const [matchEvent, paramsEvent] = useRoute("/event-registration/:eventId");
  
  const shortCode = paramsShort?.shortCode;
  const eventId = paramsEvent?.eventId;

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Find specific event by short code or ID
  const event = shortCode
    ? events.find(e => e.shortCode === shortCode)
    : eventId
    ? events.find(e => e.id === eventId)
    : events[0];

  // Check if user is already registered for this event
  const { data: existingRegistration } = useQuery<EventRegistration | null>({
    queryKey: ['/api/events', event?.id, 'my-registration'],
    queryFn: async () => {
      if (!event?.id || !isAuthenticated || !user?.email) return null;
      
      try {
        const res = await fetch(`/api/events/${event.id}/my-registration`, {
          credentials: 'include'
        });
        if (res.ok) {
          return await res.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!event?.id && isAuthenticated && !!user?.email,
  });

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

  // If user is authenticated and already registered, show registration status
  if (isAuthenticated && existingRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={eiswLogo} alt="EISW Logo" className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <h1 className="text-2xl font-bold">Curacao International Sports Week</h1>
                <p className="text-muted-foreground">Corporate Wellness Platform</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {existingRegistration.status === 'approved' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <Clock className="h-8 w-8 text-yellow-500" />
                )}
                <div>
                  <CardTitle className="text-xl">
                    {existingRegistration.status === 'approved' ? 'Registration Approved!' : 'Registration Pending'}
                  </CardTitle>
                  <CardDescription>
                    {existingRegistration.status === 'approved' 
                      ? 'You are successfully registered for this event.'
                      : 'Your registration is pending approval.'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <p>{existingRegistration.firstName} {existingRegistration.lastName}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{existingRegistration.email}</p>
                </div>
                <div>
                  <span className="font-medium">Company:</span>
                  <p>{existingRegistration.companyName}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={existingRegistration.status === 'approved' ? 'default' : 'secondary'}>
                    {existingRegistration.status}
                  </Badge>
                </div>
              </div>

              {existingRegistration.status === 'approved' && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    🎉 You're all set!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You have been approved for this event. You should receive a QR code via email shortly.
                    If you haven't received it, please check your spam folder or contact the event organizers.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => setLocation('/')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                {existingRegistration.status === 'approved' && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/events', '_blank')}
                  >
                    View All Events
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
                src={eiswLogo} 
                alt="EISW Logo" 
                className="h-16 w-auto"
                data-testid="logo-eisw"
              />
              <div className="border-l pl-3">
                <h1 className="font-semibold text-base" data-testid="nav-title">
                  Event Registration
                </h1>
                <p className="text-xs text-muted-foreground">Curacao International Sports Week</p>
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

                {/* YouTube Video Section */}
                {event.youtubeUrl && (
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => window.open(event.youtubeUrl!, '_blank')}
                      data-testid="watch-video-button"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Watch Event Video
                    </Button>
                  </div>
                )}
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
                onSubmit={handleEventRegistration}
                isSubmitting={registerMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground" data-testid="footer-text">
              Corporate Wellness Platform powered by <span className="font-semibold text-foreground">Velitt</span>, <span className="font-semibold text-foreground">Digital Adventures</span> and <span className="font-semibold text-foreground">FDDK</span>
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 FDDK. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
