import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";

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

export function CompanyEvents() {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeEvents = events?.filter(e => e.isActive) || [];

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
          activeEvents.map((event) => (
            <Card key={event.id} className="flex flex-col" data-testid={`event-card-${event.id}`}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.eventDate), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description}
                </p>
                
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
                
                <Button
                  className="w-full"
                  onClick={() => window.open(`/event-registration/${event.id}`, '_blank')}
                  data-testid={`register-${event.id}`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Register for Event
                </Button>
              </CardContent>
            </Card>
          ))
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
