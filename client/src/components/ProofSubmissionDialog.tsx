import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { S3UploadService } from "@/lib/s3Upload";
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
import { Upload, CheckCircle, Image as ImageIcon, X } from "lucide-react";

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

// Component to handle image preview with signed URL fetching
function ImagePreview({ objectKey, alt, className, onError }: { 
  objectKey: string; 
  alt: string; 
  className: string; 
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getImageUrl = async () => {
      try {
        setLoading(true);
        
        if (objectKey.startsWith('http')) {
          // Already a full URL
          setImageUrl(objectKey);
        } else if (objectKey.startsWith('uploads/')) {
          // Use CloudFront URL directly for uploaded files
          const cloudFrontUrl = `https://d7zuhbdh1qtwa.cloudfront.net/${objectKey}`;
          console.log('Using CloudFront URL for:', objectKey, '->', cloudFrontUrl);
          setImageUrl(cloudFrontUrl);
        } else {
          // Fallback to signed URL for other cases
          const response = await fetch(`/api/s3-signed-url/${encodeURIComponent(objectKey)}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            setImageUrl(data.signedUrl);
          } else {
            console.error('Failed to get signed URL:', response.status);
            onError({ currentTarget: { style: { display: 'none' } } } as any);
          }
        }
      } catch (error) {
        console.error('Error getting image URL:', error);
        onError({ currentTarget: { style: { display: 'none' } } } as any);
      } finally {
        setLoading(false);
      }
    };

    getImageUrl();
  }, [objectKey, onError]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <div className="text-xs text-muted-foreground">Failed to load</div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Image failed to load:', imageUrl);
        onError(e);
      }}
      onLoad={() => {
        console.log('Image loaded successfully:', imageUrl);
      }}
    />
  );
}

export function ProofSubmissionDialog({
  taskId,
  taskTitle,
  companyId,
  open,
  onOpenChange,
}: ProofSubmissionDialogProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, { file: File; url: string }>>(new Map()); // file name -> { file, url }

  const form = useForm<ProofSubmissionFormData>({
    resolver: zodResolver(proofSubmissionSchema),
    defaultValues: {
      contentType: "image",
    },
  });

  const handleGetUploadParameters = async () => {
    // This function is only used by the Uppy XHRUpload plugin.
    // We won't use signed URLs anymore; instead we upload directly with Supabase SDK.
    // Return a dummy URL; the actual upload happens in handleUploadComplete below.
    return { method: "PUT" as const, url: "about:blank" };
  };

  const handleUploadComplete = async (files: File[]) => {
    console.log('handleUploadComplete called with files:', files.map(f => f.name));
    
    // If no files, clear everything
    if (files.length === 0) {
      // Delete all uploaded files from S3
      for (const [fileName, { url }] of Array.from(uploadedFiles.entries())) {
        try {
          await S3UploadService.deleteFile(url);
        } catch (error) {
          console.error('Failed to delete file from S3:', fileName, error);
        }
      }
      setSelectedFiles([]);
      setUploadedFiles(new Map());
      return;
    }

    const newUploadedFiles = new Map(uploadedFiles);
    const newSelectedFiles: File[] = [];
    let newFilesCount = 0;

    // Process each selected file
    for (const file of files) {
      const fileName = file.name;
      newSelectedFiles.push(file);
      
      // Check if file is already uploaded
      if (newUploadedFiles.has(fileName)) {
        // File already uploaded, keep existing URL
        console.log('File already uploaded:', fileName);
      } else {
        // Upload new file
        try {
          console.log('Uploading new file:', fileName);
          const publicUrl = await S3UploadService.uploadFile(file);
          
          // Store the mapping
          newUploadedFiles.set(fileName, { file, url: publicUrl });
          newFilesCount++;
        } catch (error: any) {
          toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
          continue;
        }
      }
    }

    // Find files that were removed and delete them from S3
    const removedFiles: string[] = [];
    for (const [fileName, { url }] of Array.from(uploadedFiles.entries())) {
      if (!files.some(f => f.name === fileName)) {
        removedFiles.push(fileName);
        try {
          await S3UploadService.deleteFile(url);
          console.log('Deleted file from S3:', fileName);
        } catch (error) {
          console.error('Failed to delete file from S3:', fileName, error);
        }
      }
    }

    // Update states
    setSelectedFiles(newSelectedFiles);
    setUploadedFiles(newUploadedFiles);
    
    // Show appropriate toast message
    if (newFilesCount > 0) {
      toast({
        title: `${newFilesCount} file(s) uploaded!`,
        description: `You have ${newSelectedFiles.length} file(s) total. Minimum 6 required.`,
      });
    } else if (removedFiles.length > 0) {
      toast({
        title: `${removedFiles.length} file(s) removed`,
        description: `You have ${newSelectedFiles.length} file(s) total. Minimum 6 required.`,
      });
    }
  };

  const handleRemoveFile = async (fileName: string) => {
    console.log('Removing file:', fileName);
    
    // Remove from selected files
    const newSelectedFiles = selectedFiles.filter(f => f.name !== fileName);
    
    // Delete from S3 if it was uploaded
    const fileData = uploadedFiles.get(fileName);
    if (fileData) {
      try {
        await S3UploadService.deleteFile(fileData.url);
        console.log('Deleted file from S3:', fileName);
      } catch (error) {
        console.error('Failed to delete file from S3:', fileName, error);
        toast({ 
          title: 'Warning', 
          description: 'File removed from selection but may still exist in storage', 
          variant: 'destructive' 
        });
      }
    }
    
    // Update states
    const newUploadedFiles = new Map(uploadedFiles);
    newUploadedFiles.delete(fileName);
    
    setSelectedFiles(newSelectedFiles);
    setUploadedFiles(newUploadedFiles);
    
    toast({
      title: 'File removed',
      description: `You have ${newSelectedFiles.length} file(s) total. Minimum 6 required.`,
    });
  };

  const submitProofMutation = useMutation({
    mutationFn: async (data: ProofSubmissionFormData) => {
      const uploadedUrls = Array.from(uploadedFiles.values()).map(({ url }) => url);
      
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
      setSelectedFiles([]);
      setUploadedFiles(new Map());
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
    const uploadedUrls = Array.from(uploadedFiles.values()).map(({ url }) => url);
    
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
                key={form.watch("contentType")} // Force re-render when content type changes
                maxNumberOfFiles={10}
                maxFileSize={30485760}
                allowedFileTypes={
                  form.watch("contentType") === "image" 
                    ? ['.jpg', '.jpeg', '.png'] 
                    : ['.mp4', '.mov']
                }
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonVariant="outline"
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  {selectedFiles.length > 0 ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{selectedFiles.length} file(s) selected - Click to add more</span>
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
                Upload {form.watch("contentType") === "image" ? "images (JPG, PNG)" : "videos (MP4, MOV)"}. Max size: 30MB per file. Upload at least 6 files.
              </FormDescription>
              
              
              {/* Uploaded Files Preview */}
              {Array.from(uploadedFiles.values()).length > 0 && (
                <div className="mt-3 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Uploaded Files: {Array.from(uploadedFiles.values()).length} / 6 minimum
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 p-4 max-h-80 overflow-y-auto">
                    {Array.from(uploadedFiles.values()).map(({ file, url }, index) => (
                      <div
                        key={index}
                        className="w-32 h-32 rounded-lg bg-accent overflow-hidden relative group border-2 border-border shadow-md hover:shadow-lg transition-shadow flex-shrink-0 basis-1/3 max-w-[calc(33.333%-0.5rem)]"
                      >
                        {form.watch("contentType") === "image" ? (
                          <ImagePreview
                            objectKey={url}
                            alt={`Uploaded image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', url);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <video
                            src={url.startsWith('http') ? url : `/api/s3-signed-url/${encodeURIComponent(url)}`}
                            className="w-full h-full object-cover"
                            muted
                            onError={(e) => {
                              console.error('Video failed to load:', url);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        )}
                        {/* Fallback content if media fails to load */}
                        <div className="hidden absolute inset-0 flex items-center justify-center text-xs p-1 bg-muted">
                          {file.name}
                        </div>
                        {/* Remove button overlay */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.name)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
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
                  setUploadedFiles(new Map());
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitProofMutation.isPending || Array.from(uploadedFiles.values()).length < 6}
                data-testid="button-submit-proof"
              >
                {submitProofMutation.isPending ? "Submitting..." : `Submit Proof (${Array.from(uploadedFiles.values()).length}/6)`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
