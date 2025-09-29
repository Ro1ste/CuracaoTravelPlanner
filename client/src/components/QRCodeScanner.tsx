import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QrScanner from "qr-scanner";
import { QrCode, Camera, X } from "lucide-react";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
  onClose?: () => void;
}

export function QRCodeScanner({ onScan, onError, isActive = false, onClose }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [lastScannedData, setLastScannedData] = useState<string>("");

  useEffect(() => {
    if (isActive && videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code scanned:', result.data);
          setLastScannedData(result.data);
          onScan(result.data);
        },
        {
          onDecodeError: (error) => {
            console.log('QR decode error:', error);
            // Don't show errors for failed decode attempts
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScanner.start().catch((error) => {
        console.error('Failed to start camera:', error);
        setHasCamera(false);
        onError?.('Failed to access camera. Please check permissions.');
      });

      setScanner(qrScanner);

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [isActive, onScan, onError]);

  if (!isActive) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Scanner is ready to use</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Scan QR Code
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-scanner">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {hasCamera ? (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                data-testid="qr-scanner-video"
              />
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
              </div>
            </div>
            
            {lastScannedData && (
              <div>
                <Badge variant="outline" className="w-full justify-center" data-testid="last-scanned-data">
                  Last scanned: {lastScannedData.substring(0, 20)}...
                </Badge>
              </div>
            )}
            
            <p className="text-xs text-center text-muted-foreground">
              Position the QR code within the frame to scan
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-2">Camera access denied</p>
            <p className="text-xs text-muted-foreground">
              Please enable camera permissions and try again
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}