
import { ArduinoStatusIndicator } from "@/components/arduino/ArduinoStatusIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ArduinoConnectionCardProps {
  isConnected: boolean;
  onDownloadCode: () => void;
}

export function ArduinoConnectionCard({ isConnected, onDownloadCode }: ArduinoConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arduino Connection Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ArduinoStatusIndicator isConnected={isConnected} />
        <div className="mt-4 text-sm">
          <p className="mb-2">To connect your Arduino:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Upload the provided sketch to your Arduino</li>
            <li>Configure WiFi settings using the "Configure WiFi" button</li>
            <li>Use the URL parameter ?autoConnect=true for automatic connection</li>
            <li>Or click "Start Monitoring" to begin receiving data</li>
          </ol>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={onDownloadCode}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Arduino Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
