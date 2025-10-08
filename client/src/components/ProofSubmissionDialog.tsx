import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { supabase } from "@/lib/supabase";
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
import { Upload, CheckCircle, Image as ImageIcon } from "lucide-react";

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
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, string>>(new Map()); // file name -> URL mapping

  const form = useForm<ProofSubmissionFormData>({
    resolver: zodResolver(proofSubmissionSchema),
    defaultValues: {
      contentType: "image",
    },
  });

  const handleGetUploadParameters = async () => {
    // This function is only used by the Uppy XHRUpload plugin.
    // We won’t use signed URLs anymore; instead we upload directly with Supabase SDK.
    // Return a dummy URL; the actual upload happens in handleUploadComplete below.
    return { method: "PUT" as const, url: "about:blank" };
  };

  const handleUploadComplete = async (files: File[]) => {
    // If no files, clear all uploaded URLs
    if (files.length === 0) {
      setUploadedUrls([]);
      setUploadedFiles(new Map());
      return;
    }

    const currentCount = uploadedUrls.length;
    const newUploadedFiles = new Map(uploadedFiles);
    const newUploadedUrls: string[] = [];
    let newFilesCount = 0;

    // Process each file
    for (const file of files) {
      const fileName = file.name;
      
      // Check if file is already uploaded
      if (newUploadedFiles.has(fileName)) {
        // File already uploaded, use existing URL
        newUploadedUrls.push(newUploadedFiles.get(fileName)!);
      } else {
        // Upload new file
        try {
          const ext = file.name.split('.').pop() || 'bin';
          const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { data, error } = await supabase.storage
            .from('proof-uploads')
            .upload(path, file, { upsert: false });
          if (error) {
            toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
            continue;
          }
          
          // Generate the full public URL
          const publicUrl = supabase.storage
            .from('proof-uploads')
            .getPublicUrl(data.path).data.publicUrl;
          
          // Store the mapping and URL
          newUploadedFiles.set(fileName, publicUrl);
          newUploadedUrls.push(publicUrl);
          newFilesCount++;
        } catch (error: any) {
          toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
          continue;
        }
      }
    }

    // Update states
    setUploadedFiles(newUploadedFiles);
    setUploadedUrls(newUploadedUrls);
    
    // Show appropriate toast message
    if (newFilesCount > 0) {
      toast({
        title: `${newFilesCount} file(s) uploaded!`,
        description: `You have ${newUploadedUrls.length} file(s) total. Minimum 6 required.`,
      });
    } else if (newUploadedUrls.length < currentCount) {
      const removedFiles = currentCount - newUploadedUrls.length;
      toast({
        title: `${removedFiles} file(s) removed`,
        description: `You have ${newUploadedUrls.length} file(s) total. Minimum 6 required.`,
      });
    }
  };

  const submitProofMutation = useMutation({
    mutationFn: async (data: ProofSubmissionFormData) => {
      if (uploadedUrls.length < 6) {
        throw new Error("Please upload at least 6 images or videos");
      }

      if (uploadedUrls.length > 10) {
        throw new Error("Maximum 10 files allowed");
      }

      const res = await apiRequest("POST", "/api/proofs", {
        taskId,
        companyId,
        contentUrls: uploadedUrls,
        contentType: data.contentType,
      });
      return await res.json();
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
      setUploadedUrls([]);
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
    if (uploadedUrls.length < 6) {
      toast({
        title: "Error",
        description: "Please upload at least 6 images or videos",
        variant: "destructive",
      });
      return;
    }
    submitProofMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto"
        data-testid="dialog-proof-submission"
      >
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Submit Proof</DialogTitle>
          <DialogDescription>
            Submit proof for: <strong>{taskTitle}</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              Upload minimum 6 images or videos to show your activity
            </span>
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
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Upload Files (Minimum 6)</FormLabel>
              <ObjectUploader
                maxNumberOfFiles={10}
                maxFileSize={30485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonVariant="outline"
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  {uploadedUrls.length > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{uploadedUrls.length} file(s) uploaded - Click to add more</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload {form.watch("contentType")} (Minimum 6)</span>
                    </>
                  )}
                </div>
              </ObjectUploader>
              <FormDescription>
                Upload images (JPG, PNG) or videos (MP4, MOV). Max size: 30MB per file. Upload at least 6 files.
              </FormDescription>
              
              {uploadedUrls.length > 0 && (
                <div className="mt-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Uploaded Files: {uploadedUrls.length} / 6 minimum
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {uploadedUrls.map((url, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md bg-accent flex items-center justify-center text-xs p-1"
                      >
                        File {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedUrls([]);
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitProofMutation.isPending || uploadedUrls.length < 6}
                data-testid="button-submit-proof"
              >
                {submitProofMutation.isPending ? "Submitting..." : `Submit Proof (${uploadedUrls.length}/6)`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
