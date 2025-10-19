import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Mail, ArrowLeft, User, Building2, Phone as PhoneIcon, Mail as MailIcon, QrCode, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EventRegistration, Event } from "@shared/schema";
import { Link } from "wouter";
import { QRCodeScanner } from "@/components/QRCodeScanner";

export function AttendeesManagement() {
  const { toast } = useToast();
  const params = useParams();
  const eventId = params.eventId as string;
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [justCheckedInAttendee, setJustCheckedInAttendee] = useState<string | null>(null);

  const { data: event } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch event');
      return res.json();
    },
  });

  const { data: attendees = [], isLoading } = useQuery<EventRegistration[]>({
    queryKey: ['/api/events', eventId, 'registrations'],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch registrations');
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ attendeeId, status }: { attendeeId: string; status: 'approved' | 'rejected' }) => {
      await apiRequest("PATCH", `/api/events/${eventId}/registrations/${attendeeId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'registrations'] });
      toast({
        title: "Status Updated",
        description: "Attendee status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update attendee status",
        variant: "destructive",
      });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      await apiRequest("POST", `/api/events/${eventId}/registrations/${attendeeId}/resend`, {});
    },
    onSuccess: () => {
      toast({
        title: "Email Resent",
        description: "QR code email has been resent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend email",
        variant: "destructive",
      });
    },
  });

  const qrCheckInMutation = useMutation({
    mutationFn: async (qrData: { attendeeId: string; eventId: string; token: string }) => {
      await apiRequest("POST", "/api/registrations/qr-checkin", qrData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'registrations'] });
      setJustCheckedInAttendee(variables.attendeeId);
      toast({
        title: "Check-in Successful",
        description: "Attendee has been successfully checked in",
      });
      setQrScannerOpen(false);

      // Clear the highlight after 3 seconds
      setTimeout(() => {
        setJustCheckedInAttendee(null);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in attendee",
        variant: "destructive",
      });
    },
  });

  const pendingAttendees = attendees.filter(a => a.status === 'pending');
  const approvedAttendees = attendees.filter(a => a.status === 'approved');
  const rejectedAttendees = attendees.filter(a => a.status === 'rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-qr-scanner">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scan Attendee QR Code</DialogTitle>
            </DialogHeader>
            <QRCodeScanner
              isActive={qrScannerOpen}
              onScan={(qrData) => {
                try {
                  const parsed = JSON.parse(qrData);
                  if (parsed.attendeeId && parsed.eventId && parsed.token) {
                    qrCheckInMutation.mutate(parsed);
                  } else {
                    toast({
                      title: "Invalid QR Code",
                      description: "This QR code does not contain valid check-in data",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Invalid QR Code",
                    description: "This QR code is not in the expected format",
                    variant: "destructive",
                  });
                }
              }}
              onError={(error) => {
                toast({
                  title: "Scanner Error",
                  description: error,
                  variant: "destructive",
                });
              }}
              onClose={() => setQrScannerOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h1 className="text-3xl font-bold" data-testid="page-title">Attendee Management</h1>
        <p className="text-muted-foreground">{event?.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAttendees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedAttendees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedAttendees.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No registrations yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map((attendee) => (
                    <TableRow
                      key={attendee.id}
                      data-testid={`attendee-${attendee.id}`}
                      className={`${
                        justCheckedInAttendee === attendee.id
                          ? 'bg-green-50 border-green-200 animate-pulse'
                          : attendee.checkedIn
                          ? 'bg-green-50/30 border-green-200'
                          : ''
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`name-${attendee.id}`}>
                            {attendee.firstName} {attendee.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm" data-testid={`email-${attendee.id}`}>
                            {attendee.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm" data-testid={`phone-${attendee.id}`}>
                            {attendee.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm" data-testid={`company-${attendee.id}`}>
                            {attendee.companyName || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {attendee.registeredAt 
                          ? new Date(attendee.registeredAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={
                              attendee.status === 'approved'
                                ? 'default'
                                : attendee.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                            data-testid={`status-${attendee.id}`}
                          >
                            {attendee.status}
                          </Badge>
                          {justCheckedInAttendee === attendee.id && attendee.checkedIn && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Just Checked In!
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {attendee.status === 'pending' && !attendee.checkedIn && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateStatusMutation.mutate({ attendeeId: attendee.id, status: 'approved' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-approve-${attendee.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatusMutation.mutate({ attendeeId: attendee.id, status: 'rejected' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-reject-${attendee.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {attendee.status === 'approved' && !attendee.checkedIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendEmailMutation.mutate(attendee.id)}
                              disabled={resendEmailMutation.isPending}
                              data-testid={`button-resend-${attendee.id}`}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Resend QR Code
                            </Button>
                          )}
                          {attendee.checkedIn && (
                            <Badge variant="outline" className="bg-green-500 text-white border-green-500 text-sm font-semibold px-3 py-1">
                              ✓ Checked In
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
