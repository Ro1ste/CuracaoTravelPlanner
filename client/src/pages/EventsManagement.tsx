import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, Link2, Plus, Copy, Check, UserCheck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { insertEventSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function EventsManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Extend insertEventSchema with additional validation
  const eventFormSchema = insertEventSchema.extend({
    title: z.string().min(1, "Event title is required").min(5, "Title must be at least 5 characters"),
    description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
    eventDate: z.string().min(1, "Event date is required").refine(
      (date) => new Date(date) > new Date(),
      "Event date must be in the future"
    ),
    youtubeUrl: z.string().optional().refine(
      (url) => !url || url.includes('youtube.com') || url.includes('youtu.be'),
      "Please enter a valid YouTube URL"
    ),
    brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use hex color like #ff6600)"),
    emailSubject: z.string().optional(),
    emailBodyText: z.string().optional()
  });

  const form = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: "",
      youtubeUrl: "",
      brandingColor: "#ff6600",
      emailSubject: "",
      emailBodyText: ""
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      eventDate: string;
      brandingColor: string;
    }) => {
      const res = await apiRequest("POST", "/api/events", data);
      return await res.json();
    },
    onSuccess: (newEvent) => {
      toast({
        title: "Event Created!",
        description: "Your event has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setCreateDialogOpen(false);
      form.reset();
      
      // Show shareable link toast
      const shareableLink = `${window.location.origin}/event-registration/${newEvent.id}`;
      toast({
        title: "Shareable Link Ready",
        description: shareableLink,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Event",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createEventMutation.mutate(data);
  };

  const getShareableLink = (eventId: string) => {
    return `${window.location.origin}/event-registration/${eventId}`;
  };

  const copyLinkToClipboard = async (eventId: string) => {
    const link = getShareableLink(eventId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedEventId(eventId);
      toast({
        title: "Link Copied!",
        description: "Shareable link has been copied to clipboard",
      });
      setTimeout(() => setCopiedEventId(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to Copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Events Management</h1>
          <p className="text-muted-foreground">Create and manage corporate wellness events</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Corporate Wellness Summit 2024" 
                          data-testid="input-event-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your event..."
                          rows={4}
                          data-testid="input-event-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Video URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://www.youtube.com/watch?v=..."
                          data-testid="input-event-youtube-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="datetime-local"
                          data-testid="input-event-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandingColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branding Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            type="color"
                            className="w-20 h-10"
                            data-testid="input-event-color"
                          />
                          <Input 
                            {...field} 
                            placeholder="#ff6600"
                            data-testid="input-event-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-sm font-semibold">Email Template (Optional)</h3>
                  <p className="text-xs text-muted-foreground">
                    Customize the email sent when attendees are approved. Leave blank to use default template.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="emailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Your Registration for {Event Name} is Approved!"
                            data-testid="input-email-subject"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailBodyText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Dear attendee, your registration has been approved..."
                            rows={4}
                            data-testid="input-email-body"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-event"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEventMutation.isPending}
                    data-testid="button-submit-event"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {eventsLoading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Loading events...
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No events created yet. Click "Create Event" to get started.
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            const totalRegistrations = (event as any)?.totalRegistrations ?? 0;
            const approvedRegistrations = (event as any)?.approvedRegistrations ?? 0;
            const checkedInRegistrations = (event as any)?.checkedInRegistrations ?? 0;
            
            return (
              <Card key={event.id} data-testid={`event-card-${event.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2" data-testid={`event-title-${event.id}`}>
                        {event.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`event-description-${event.id}`}>
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`event-date-${event.id}`}>
                            {event.eventDate 
                              ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'Date TBD'}
                          </span>
                        </div>
                        <Badge variant={event.isActive ? "default" : "secondary"}>
                          {event.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="w-12 h-12 rounded-lg"
                      style={{ backgroundColor: event.brandingColor || "#ff6600" }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-2xl font-bold" data-testid={`event-total-${event.id}`}>
                            {totalRegistrations}
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold" data-testid={`event-approved-${event.id}`}>
                            {approvedRegistrations}
                          </p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold" data-testid={`event-checkedin-${event.id}`}>
                            {checkedInRegistrations}
                          </p>
                          <p className="text-xs text-muted-foreground">Checked In</p>
                        </div>
                      </div>
                    </div>

                    {/* Shareable Link */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <Label className="text-xs font-semibold flex items-center gap-2">
                        <Link2 className="h-3 w-3" />
                        Shareable Registration Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={getShareableLink(event.id)}
                          className="flex-1 font-mono text-sm"
                          data-testid={`input-shareable-link-${event.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLinkToClipboard(event.id)}
                          data-testid={`button-copy-link-${event.id}`}
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Link href={`/events/${event.id}/attendees`}>
                        <Button variant="outline" size="sm" data-testid={`button-manage-attendees-${event.id}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Manage Attendees
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
