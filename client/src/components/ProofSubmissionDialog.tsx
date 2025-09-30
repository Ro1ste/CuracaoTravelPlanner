import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle } from "lucide-react";

const proofSubmissionSchema = z.object({
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
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [proofId, setProofId] = useState<string | null>(null);

  const form = useForm<ProofSubmissionFormData>({
    resolver: zodResolver(proofSubmissionSchema),
    defaultValues: {
      contentType: "image",
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest<{ uploadURL: string }>(
      "POST",
      "/api/objects/upload",
      {}
    );
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    if (result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      setUploadedUrl(uploadURL || null);
      toast({
        title: "File uploaded!",
        description: "Your file has been uploaded successfully.",
      });
    }
  };

  const submitProofMutation = useMutation({
    mutationFn: async (data: ProofSubmissionFormData) => {
      if (!uploadedUrl) {
        throw new Error("Please upload a file first");
      }

      // First, create the proof with a placeholder URL
      const res = await apiRequest("POST", "/api/proofs", {
        taskId,
        companyId,
        contentUrl: uploadedUrl,
        contentType: data.contentType,
      });
      const proof = await res.json();

      // Then update the proof with the normalized object path and set ACL
      await apiRequest("PUT", `/api/proofs/${proof.id}/content`, {
        contentURL: uploadedUrl,
      });

      return proof;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your proof has been submitted for review.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/companies", companyId, "proofs"],
      });
      form.reset();
      setUploadedUrl(null);
      setProofId(null);
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
    if (!uploadedUrl) {
      toast({
        title: "Error",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }
    submitProofMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        data-testid="dialog-proof-submission"
      >
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

            <div className="space-y-2">
              <FormLabel>Upload File</FormLabel>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonVariant="outline"
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  {uploadedUrl ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>File Uploaded - Click to Replace</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload {form.watch("contentType")}</span>
                    </>
                  )}
                </div>
              </ObjectUploader>
              <FormDescription>
                Upload an image (JPG, PNG) or video (MP4, MOV). Max size: 10MB
              </FormDescription>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedUrl(null);
                  setProofId(null);
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitProofMutation.isPending || !uploadedUrl}
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
