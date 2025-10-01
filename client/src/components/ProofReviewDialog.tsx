import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proofReviewSchema, type ProofReview, type TaskProof, type Task, type Company } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Play } from "lucide-react";

interface ProofReviewDialogProps {
  proof: TaskProof & { task?: Task; company?: Company };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProofReviewDialog({
  proof,
  open,
  onOpenChange,
}: ProofReviewDialogProps) {
  const { toast } = useToast();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const form = useForm<ProofReview>({
    resolver: zodResolver(proofReviewSchema),
    defaultValues: {
      status: 'approved',
      adminNotes: "",
    },
  });

  const reviewProofMutation = useMutation({
    mutationFn: async (data: ProofReview) => {
      return await apiRequest("PATCH", `/api/proofs/${proof.id}/review`, data);
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
      form.reset();
      onOpenChange(false);
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

  const contentUrls = proof.contentUrls || [];
  const selectedUrl = contentUrls[selectedMediaIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-proof-review">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Review Proof Submission</DialogTitle>
          <DialogDescription>
            Review and approve or reject this proof submission ({contentUrls.length} files)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Proof Details */}
          <div className="space-y-2">
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
                className={
                  proof.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : proof.status === 'rejected'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }
              >
                {proof.status}
              </Badge>
            </div>
          </div>

          {/* Content Gallery */}
          <div className="border rounded-md p-4 space-y-3">
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
                  View Full Size
                  <ExternalLink className="h-3 w-3" />
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
                        src={url}
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
          </div>

          {/* Review Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this review..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-admin-notes"
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be stored with the review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={reviewProofMutation.isPending}
            data-testid="button-reject"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={reviewProofMutation.isPending}
            data-testid="button-approve"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {reviewProofMutation.isPending ? "Processing..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
