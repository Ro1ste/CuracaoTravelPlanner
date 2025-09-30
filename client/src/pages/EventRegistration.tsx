import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, EventRegistration as EventRegistrationType } from "@shared/schema";

export function EventRegistration() {
  const { toast } = useToast();
  const [activeScanner, setActiveScanner] = useState(false);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Use first active event as default
  const event = events[0];

  // Fetch registrations for the event
  const { data: registrations = [] } = useQuery<EventRegistrationType[]>({
    queryKey: ['/api/events', event?.id, 'registrations'],
    enabled: !!event?.id,
  });

  // Calculate stats
  const totalRegistrations = registrations.length;
  const approvedAttendees = registrations.filter(r => r.status === 'approved').length;
  const checkedInAttendees = registrations.filter(r => r.checkedIn).length;

  const registerMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) => {
      if (!event?.id) throw new Error("No event available");
      
      const res = await apiRequest("POST", `/api/events/${event.id}/register`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted!",
        description: "Thank you for registering! You'll receive a confirmation email shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event?.id, 'registrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    },
  });

  const handleEventRegistration = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => {
    registerMutation.mutate(data);
  };

  const handleQRScan = (qrData: string) => {
    console.log('QR Code scanned:', qrData);
    toast({
      title: "Attendee Checked In",
      description: `Successfully checked in attendee: ${qrData}`,
    });
    setActiveScanner(false);
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scanner Error",
      description: error,
      variant: "destructive",
    });
  };

  if (eventsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">No active events available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Event Management</h1>
        <p className="text-muted-foreground">Manage event registrations and check-ins</p>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-registrations">
                  {totalRegistrations}
                </p>
                <p className="text-xs text-muted-foreground">Total Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-approved-attendees">
                  {approvedAttendees}
                </p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-pending-approvals">
                  {totalRegistrations - approvedAttendees}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="stat-checked-in">
                  {checkedInAttendees}
                </p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="registration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registration" data-testid="tab-registration">
            Event Registration
          </TabsTrigger>
          <TabsTrigger value="checkin" data-testid="tab-checkin">
            Check-In Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle data-testid="event-info-title">Event Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold mb-2" data-testid="event-title">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid="event-description">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm" data-testid="event-date">
                      {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Date TBD'}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {totalRegistrations} registered
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <div>
              <EventRegistrationForm
                eventTitle={event.title}
                eventDescription={event.description ?? ""}
                onSubmit={handleEventRegistration}
                isSubmitting={registerMutation.isPending}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checkin" className="space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle data-testid="checkin-title">Event Check-In</CardTitle>
                <p className="text-muted-foreground">
                  Scan attendee QR codes to check them in to the event
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {!activeScanner ? (
                    <button
                      onClick={() => setActiveScanner(true)}
                      className="w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors"
                      data-testid="button-start-scanner"
                    >
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-medium">Start QR Scanner</p>
                        <p className="text-sm text-muted-foreground">
                          Click to activate camera for QR code scanning
                        </p>
                      </div>
                    </button>
                  ) : (
                    <QRCodeScanner
                      onScan={handleQRScan}
                      onError={handleScanError}
                      isActive={activeScanner}
                      onClose={() => setActiveScanner(false)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}