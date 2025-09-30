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
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-proof-review">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Review Proof Submission</DialogTitle>
          <DialogDescription>
            Review and approve or reject this proof submission
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

          {/* Content Preview */}
          <div className="border rounded-md p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Proof Content:</span>
              <a
                href={proof.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
                data-testid="link-view-content"
              >
                View Full Content
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {proof.contentType === 'image' ? (
              <img
                src={proof.contentUrl}
                alt="Proof content"
                className="w-full max-h-64 object-contain rounded-md"
                data-testid="proof-image"
              />
            ) : (
              <video
                src={proof.contentUrl}
                controls
                className="w-full max-h-64 rounded-md"
                data-testid="proof-video"
              />
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
