import { QRCodeScanner } from '../QRCodeScanner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function QRCodeScannerExample() {
  const [isActive, setIsActive] = useState(false);
  const [lastScanned, setLastScanned] = useState('');

  const handleScan = (data: string) => {
    console.log('QR Code scanned:', data);
    setLastScanned(data);
    setIsActive(false);
  };

  const handleError = (error: string) => {
    console.error('Scanner error:', error);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={() => setIsActive(!isActive)}
          variant={isActive ? "secondary" : "default"}
        >
          {isActive ? "Stop Scanner" : "Start Scanner"}
        </Button>
      </div>
      
      {lastScanned && (
        <div className="p-2 bg-muted rounded">
          <p className="text-sm">Last scanned: {lastScanned}</p>
        </div>
      )}
      
      <QRCodeScanner
        onScan={handleScan}
        onError={handleError}
        isActive={isActive}
        onClose={() => setIsActive(false)}
      />
    </div>
  );
}