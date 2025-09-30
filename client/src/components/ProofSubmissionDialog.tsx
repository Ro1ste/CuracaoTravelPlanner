import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const proofSubmissionSchema = z.object({
  contentUrl: z.string().url("Please enter a valid URL"),
  contentType: z.enum(["image", "video"]),
});

type ProofSubmissionFormData = z.infer<typeof proofSubmissionSchema>;

interface ProofSubmissionDialogProps {
  taskId: string;
  taskTitle: string;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProofSubmissionDialog({
  taskId,
  taskTitle,
  companyId,
  open,
  onOpenChange,
}: ProofSubmissionDialogProps) {
  const { toast } = useToast();

  const form = useForm<ProofSubmissionFormData>({
    resolver: zodResolver(proofSubmissionSchema),
    defaultValues: {
      contentUrl: "",
      contentType: "image",
    },
  });

  const submitProofMutation = useMutation({
    mutationFn: async (data: ProofSubmissionFormData) => {
      return await apiRequest("POST", "/api/proofs", {
        taskId,
        companyId,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your proof has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "proofs"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit proof",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProofSubmissionFormData) => {
    submitProofMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-proof-submission">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Submit Proof</DialogTitle>
          <DialogDescription>
            Submit proof for: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-content-type">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      data-testid="input-content-url"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the URL of your proof image or video
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitProofMutation.isPending}
                data-testid="button-submit-proof"
              >
                {submitProofMutation.isPending ? "Submitting..." : "Submit Proof"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
