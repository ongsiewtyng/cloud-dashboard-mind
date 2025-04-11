
import { ArduinoStatusIndicator } from "@/components/arduino/ArduinoStatusIndicator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ArduinoConnectionCardProps {
  isConnected: boolean;
  onDownloadCode: () => void;
  wifiStatus: {
    connected: boolean;
    networks?: string[];
    ssid?: string;
    strength?: number;
  };
  error: string | null;
}

export function ArduinoConnectionCard({ 
  isConnected, 
  onDownloadCode, 
  wifiStatus,
  error 
}: ArduinoConnectionCardProps) {
  
  // Get WiFi strength level for visualization
  const getWifiStrength = () => {
    if (!wifiStatus.strength) return "unknown";
    if (wifiStatus.strength > -50) return "excellent";
    if (wifiStatus.strength > -70) return "good";
    if (wifiStatus.strength > -85) return "fair";
    return "poor";
  };
  
  const wifiStrength = getWifiStrength();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Arduino Connection Status</CardTitle>
            <CardDescription>
              Monitor your Arduino device connection and WiFi status
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50">Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ArduinoStatusIndicator isConnected={isConnected} wifiStatus={wifiStatus} />
        
        {/* WiFi Status Information */}
        {wifiStatus.connected && wifiStatus.ssid && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-blue-600" />
                <span className="font-medium">WiFi Connected</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  wifiStrength === "excellent" ? "bg-green-50 text-green-700" :
                  wifiStrength === "good" ? "bg-blue-50 text-blue-700" :
                  wifiStrength === "fair" ? "bg-yellow-50 text-yellow-700" :
                  "bg-red-50 text-red-700"
                }`}
              >
                Signal: {wifiStrength}
              </Badge>
            </div>
            <p className="text-sm mt-1">
              Connected to network: <span className="font-medium">{wifiStatus.ssid}</span>
            </p>
          </div>
        )}
        
        {!wifiStatus.connected && isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">WiFi not connected</p>
              <p className="text-xs">Use the "Configure WiFi" button to set up your WiFi connection</p>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Connection Instructions */}
        <div className="mt-4 text-sm">
          <p className="mb-2 font-medium">To connect your Arduino:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Upload the provided sketch to your Arduino</li>
            <li>Connect your Arduino to your computer via USB</li>
            <li>Click "Start Monitoring" to connect to your Arduino</li>
            <li>Configure WiFi settings using the "Configure WiFi" button</li>
          </ol>
          
          {!isConnected && (
            <Alert variant="default" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Troubleshooting</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>- Make sure your Arduino is properly connected via USB</p>
                <p>- Check that you've uploaded the correct sketch</p>
                <p>- Try opening the serial monitor in Arduino IDE, then close it and try again</p>
                <p>- Some browsers may require HTTPS for Serial API access</p>
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full"
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
