// Referenced from blueprint:javascript_object_storage
import { useState, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  buttonVariant = "default",
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['.jpg', '.jpeg', '.png', '.mp4', '.mov'],
      },
      autoProceed: false,
    })
      .use(XHRUpload, {
        endpoint: "placeholder",
        method: "PUT",
        getUploadParameters: async (file: any) => {
          const params = await onGetUploadParameters();
          return {
            method: params.method,
            url: params.url,
            headers: {},
          };
        },
        getResponseData: (xhr: XMLHttpRequest) => {
          // GCS signed URLs return empty body or XML, not JSON
          // Extract the upload URL from the response URL (without query parameters)
          const uploadUrl = xhr.responseURL.split('?')[0];
          return {
            url: uploadUrl,
          };
        },
      })
      .on("complete", (result) => {
        onComplete?.(result);
        // Auto-close modal after upload completes
        setShowModal(false);
      })
  );

  const handleButtonClick = () => {
    console.log('Upload button clicked, opening modal...');
    if (useFallback) {
      fileInputRef.current?.click();
    } else {
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    console.log('Modal closed');
    setShowModal(false);
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array and create a mock UploadResult
    const fileArray = Array.from(files);
    const successful = fileArray.map(file => ({ data: file }));
    
    const mockResult: UploadResult<Record<string, any>, Record<string, any>> = {
      successful,
      failed: [],
      total: fileArray.length,
    };

    onComplete?.(mockResult);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName}
        variant={buttonVariant}
        type="button"
      >
        {children}
      </Button>

      {/* Fallback file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxNumberOfFiles > 1}
        accept=".jpg,.jpeg,.png,.mp4,.mov"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Uppy Modal */}
      {showModal && (
        <DashboardModal
          uppy={uppy}
          open={showModal}
          onRequestClose={handleModalClose}
          proudlyDisplayPoweredByUppy={false}
          closeModalOnClickOutside={true}
        />
      )}

      {/* Debug button to switch to fallback */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          onClick={() => setUseFallback(!useFallback)}
          variant="ghost"
          size="sm"
          className="ml-2 text-xs"
        >
          {useFallback ? 'Use Uppy' : 'Use Fallback'}
        </Button>
      )}
    </div>
  );
}
