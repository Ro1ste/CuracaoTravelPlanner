import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Users, Link2, Plus, Copy, Check, UserCheck, Trash2 } from "lucide-react";
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Base schema without future date validation (used for editing)
  const baseEventFormSchema = insertEventSchema.extend({
    title: z.string().min(1, "Event title is required").min(5, "Title must be at least 5 characters"),
    description: z.string().min(1, "Description is required").min(10, "Description must be at least 10 characters"),
    eventDate: z.string().min(1, "Event date is required"),
    youtubeUrl: z.string().optional().refine(
      (url) => !url || url.includes('youtube.com') || url.includes('youtu.be'),
      "Please enter a valid YouTube URL"
    ),
    brandingColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (use hex color like #ff6600)"),
    emailSubject: z.string().optional(),
    emailBodyText: z.string().optional()
  });

  // Schema for creating new events (requires future date)
  const createEventFormSchema = baseEventFormSchema.extend({
    eventDate: z.string().min(1, "Event date is required").refine(
      (date) => new Date(date) > new Date(),
      "Event date must be in the future"
    ),
  });

  const eventFormSchema = editingEvent ? baseEventFormSchema : createEventFormSchema;

  // Create separate forms for create and edit to handle different validation
  const createForm = useForm({
    resolver: zodResolver(createEventFormSchema),
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

  const editForm = useForm({
    resolver: zodResolver(baseEventFormSchema),
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

  // Reset editForm when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      // Format date for datetime-local input in Curacao time (AST, UTC-4)
      let formattedDate = "";
      if (editingEvent.eventDate) {
        // The date from server is in UTC, convert to Curacao time (UTC-4)
        const utcDate = new Date(editingEvent.eventDate);
        // Subtract 4 hours to get Curacao time
        const curacaoTime = new Date(utcDate.getTime() - (4 * 60 * 60 * 1000));
        const year = curacaoTime.getUTCFullYear();
        const month = String(curacaoTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(curacaoTime.getUTCDate()).padStart(2, '0');
        const hours = String(curacaoTime.getUTCHours()).padStart(2, '0');
        const minutes = String(curacaoTime.getUTCMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      editForm.reset({
        title: editingEvent.title,
        description: editingEvent.description || "",
        eventDate: formattedDate,
        youtubeUrl: editingEvent.youtubeUrl || "",
        brandingColor: editingEvent.brandingColor || "#211100",
        emailSubject: editingEvent.emailSubject || "",
        emailBodyText: editingEvent.emailBodyText || ""
      });
    }
  }, [editingEvent, editForm]);

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      eventDate: string;
      youtubeUrl?: string;
      brandingColor: string;
      emailSubject?: string;
      emailBodyText?: string;
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
      createForm.reset();
      
      // Show shareable link toast  
      const shareableLink = `${window.location.origin}/e/${newEvent.shortCode}`;
      toast({
        title: "Short Link Ready",
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

  const updateEventMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      description: string;
      eventDate: string;
      youtubeUrl?: string;
      brandingColor: string;
      emailSubject?: string;
      emailBodyText?: string;
    }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PATCH", `/api/events/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Updated!",
        description: "Your event has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setEditDialogOpen(false);
      setEditingEvent(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Event",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted!",
        description: "The event has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Event",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const onCreateSubmit = (data: any) => {
    createEventMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (editingEvent) {
      updateEventMutation.mutate({ ...data, id: editingEvent.id });
    }
  };

  const getShareableLink = (event: Event) => {
    return `${window.location.origin}/e/${event.shortCode}`;
  };

  const copyLinkToClipboard = async (event: Event) => {
    const link = getShareableLink(event);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedEventId(event.id);
      toast({
        title: "Short Link Copied!",
        description: link,
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

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
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
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
                  control={createForm.control}
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
                    control={createForm.control}
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
                    control={createForm.control}
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

        {/* Edit Event Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter event description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="brandingColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branding Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="emailSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Registration for {Event Title} is Approved!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="emailBodyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body Text (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dear {Attendee Name},&#10;&#10;Your registration for {Event Title} has been approved!&#10;&#10;Please find your QR code below. You'll need to present this at the event for check-in.&#10;&#10;We look forward to seeing you!&#10;&#10;Best regards,&#10;FDDK Team" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setEditingEvent(null);
                      editForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateEventMutation.isPending}
                    data-testid="button-update-event"
                  >
                    {updateEventMutation.isPending ? "Updating..." : "Update Event"}
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
                      <div className="text-sm text-muted-foreground mb-3 space-y-2" data-testid={`event-description-${event.id}`}>
                        {event.description?.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {paragraph.split('\n').map((line, lineIndex) => (
                              <span key={lineIndex}>
                                {line}
                                {lineIndex < paragraph.split('\n').length - 1 && <br />}
                              </span>
                            ))}
                          </p>
                        )) || <p>{event.description}</p>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`event-date-${event.id}`}>
                            {event.eventDate 
                              ? new Date(event.eventDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'America/Curacao'
                                })
                              : 'Date TBD'}
                          </span>
                        </div>
                        <Badge variant={event.isActive ? "default" : "secondary"}>
                          {event.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                        data-testid={`button-edit-event-${event.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                        data-testid={`button-delete-event-${event.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: event.brandingColor || "#ff6600" }}
                      />
                    </div>
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
                          value={getShareableLink(event)}
                          className="flex-1 font-mono text-sm"
                          data-testid={`input-shareable-link-${event.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLinkToClipboard(event)}
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
                    <div className="flex gap-2 pt-4 border-t flex-wrap">
                      <Link href={`/checkin-display/${event.id}`} target="_blank">
                        <Button variant="outline" size="sm" data-testid={`button-checkin-display-${event.id}`}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Check-in Display
                        </Button>
                      </Link>
                      <Link href={`/events/${event.id}/attendees`}>
                        <Button variant="outline" size="sm" data-testid={`button-manage-attendees-${event.id}`}>
                          <Users className="h-4 w-4 mr-2" />
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
