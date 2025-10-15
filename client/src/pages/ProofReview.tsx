import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proofReviewSchema, type ProofReview, type TaskProof, type Task, type Company } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Play, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function ProofReview() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/proofs/:proofId");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const proofId = params?.proofId;

  // Fetch proof details
  const { data: proof, isLoading } = useQuery<TaskProof & { task?: Task; company?: Company }>({
    queryKey: ["/api/proofs", proofId],
    queryFn: async () => {
      if (!proofId) return null;
      const response = await fetch(`/api/proofs/${proofId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch proof');
      return response.json();
    },
    enabled: !!proofId,
  });

  const form = useForm<ProofReview>({
    resolver: zodResolver(proofReviewSchema),
    defaultValues: {
      status: 'approved',
      adminNotes: "",
    },
  });

  // Convert path to full URL if needed
  const getFullUrl = (urlOrPath: string): string => {
    // If it's already a full URL, return as is
    if (urlOrPath.startsWith('http')) {
      return urlOrPath;
    }
    // For S3, assume it's already a full URL or return as is
    return urlOrPath;
  };

  const reviewProofMutation = useMutation({
    mutationFn: async (data: ProofReview) => {
      if (!proofId) throw new Error('No proof ID');
      return await apiRequest("PATCH", `/api/proofs/${proofId}/review`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Proof review submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/proofs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proofs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      // Navigate back to admin dashboard
      setLocation('/admin');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProofReview) => {
    reviewProofMutation.mutate(data);
  };

  const handleApprove = () => {
    form.setValue('status', 'approved');
    form.handleSubmit(onSubmit)();
  };

  const handleReject = () => {
    form.setValue('status', 'rejected');
    form.handleSubmit(onSubmit)();
  };

  if (!match || !proofId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Proof not found</p>
            <Button 
              onClick={() => setLocation('/admin')} 
              className="w-full mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading proof...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Proof not found</p>
            <Button 
              onClick={() => setLocation('/admin')} 
              className="w-full mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentUrls = proof.contentUrls || [];
  const selectedUrl = contentUrls[selectedMediaIndex] ? getFullUrl(contentUrls[selectedMediaIndex]) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold">Review Proof Submission</h1>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Proof Details */}
          <Card>
            <CardHeader>
              <CardTitle>Proof Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Company:</span>
                  <span className="text-sm" data-testid="proof-company">
                    {proof.company?.name || 'Unknown Company'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Task:</span>
                  <span className="text-sm" data-testid="proof-task">
                    {proof.task?.title || 'Unknown Task'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Type:</span>
                  <Badge variant="outline">{proof.contentType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Files Submitted:</span>
                  <Badge variant="outline">{contentUrls.length} files</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Submitted:</span>
                  <span className="text-sm text-muted-foreground">
                    {proof.submittedAt ? new Date(proof.submittedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge 
                    variant={proof.status === 'approved' ? 'default' : proof.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {proof.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Proof Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Proof Content ({selectedMediaIndex + 1}/{contentUrls.length}):
                </span>
                {selectedUrl && (
                  <a
                    href={selectedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    data-testid="link-view-content"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Full Size
                  </a>
                )}
              </div>

              {/* Main Preview */}
              {selectedUrl && (
                <div className="bg-muted/30 rounded-md overflow-hidden">
                  {proof.contentType === 'image' ? (
                    <img
                      src={selectedUrl}
                      alt={`Proof content ${selectedMediaIndex + 1}`}
                      className="w-full max-h-96 object-contain"
                      data-testid="proof-image"
                    />
                  ) : (
                    <video
                      src={selectedUrl}
                      controls
                      className="w-full max-h-96"
                      data-testid="proof-video"
                    />
                  )}
                </div>
              )}

              {/* Thumbnail Gallery */}
              {contentUrls.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {contentUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 transition-all hover-elevate ${
                        selectedMediaIndex === index
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border'
                      }`}
                      data-testid={`thumbnail-${index}`}
                    >
                      {proof.contentType === 'image' ? (
                        <img
                          src={getFullUrl(url)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Play className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="sr-only">File {index + 1}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card>
            <CardHeader>
              <CardTitle>Review & Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                  {...form.register('adminNotes')}
                  placeholder="Add any notes about this proof submission..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={reviewProofMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={reviewProofMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
