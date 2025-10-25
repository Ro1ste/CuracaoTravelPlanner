import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string | null;
  eventDate: string;
  brandingColor: string;
  isActive: boolean;
  createdAt: string;
}

interface EventRegistration {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  status: 'pending' | 'approved' | 'rejected';
  checkedIn: boolean;
  registeredAt: string;
}

export function CompanyEvents() {
  const { user } = useAuth();
  
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Fetch company information
  const { data: company } = useQuery({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  // Fetch all event registrations for this company
  const { data: registrations = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/company/registrations"],
    enabled: !!company?.email,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeEvents = events?.filter(e => e.isActive) || [];

  // Helper function to get registration status for an event
  const getRegistrationStatus = (eventId: string) => {
    const registration = registrations.find(reg => reg.eventId === eventId);
    if (!registration) return null;
    return registration;
  };

  // Helper function to get status badge
  const getStatusBadge = (registration: EventRegistration) => {
    if (registration.checkedIn) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Checked In
        </Badge>
      );
    }
    
    switch (registration.status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Events</h1>
        <p className="text-muted-foreground">
          Upcoming wellness events and activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeEvents.length > 0 ? (
          activeEvents.map((event) => {
            const registration = getRegistrationStatus(event.id);
            
            return (
              <Card key={event.id} className="flex flex-col" data-testid={`event-card-${event.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'America/Curacao'
                        }) : 'Date To Be Announced'}
                      </CardDescription>
                    </div>
                    {registration && (
                      <div className="ml-2">
                        {getStatusBadge(registration)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div className="text-sm text-muted-foreground line-clamp-3 space-y-1">
                      {event.description?.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-1 last:mb-0">
                          {paragraph.split('\n').map((line, lineIndex) => (
                            <span key={lineIndex}>
                              {line}
                              {lineIndex < paragraph.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      )) || <p>{event.description}</p>}
                    </div>
                    
                    {event.youtubeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(event.youtubeUrl!, '_blank')}
                        data-testid={`watch-video-${event.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch Video
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {registration ? (
                      <div className="space-y-2">
                        {registration.status === 'approved' && !registration.checkedIn && (
                          <div className="text-center text-sm text-muted-foreground">
                            <p>✅ Registration approved! Check your email for QR code.</p>
                          </div>
                        )}
                        {registration.status === 'pending' && (
                          <div className="text-center text-sm text-muted-foreground">
                            <p>⏳ Registration pending approval</p>
                          </div>
                        )}
                        {registration.status === 'rejected' && (
                          <div className="text-center text-sm text-muted-foreground">
                            <p>❌ Registration was rejected</p>
                          </div>
                        )}
                        {registration.checkedIn && (
                          <div className="text-center text-sm text-muted-foreground">
                            <p>🎉 You've checked in for this event!</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled
                          data-testid={`registered-${event.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already Registered
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => window.open(`/event-registration/${event.id}`, '_blank')}
                        data-testid={`register-${event.id}`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Register for Event
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events at this time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
