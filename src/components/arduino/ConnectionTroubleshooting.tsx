
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, Terminal } from "lucide-react";
import { useState } from "react";

interface ConnectionTroubleshootingProps {
  onScanPorts?: () => void;
  onReconnect?: () => void;
}

export function ConnectionTroubleshooting({ onScanPorts, onReconnect }: ConnectionTroubleshootingProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full mt-4"
    >
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between w-full">
          <span>Connection Troubleshooting</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </AlertTitle>
        <AlertDescription className="text-xs">
          Having trouble connecting? Click to show troubleshooting steps.
        </AlertDescription>
      </Alert>
      
      <CollapsibleContent className="mt-2 space-y-4 border p-4 rounded-md">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Common Connection Issues</h4>
          <ul className="text-xs space-y-1 list-disc pl-4">
            <li>Make sure your Arduino is properly connected via USB</li>
            <li>Check that you have the correct libraries installed (ArduinoJson, WiFiS3)</li>
            <li>Verify that your Arduino board has built-in WiFi capability</li>
            <li>Ensure your browser supports the Web Serial API (Chrome, Edge)</li>
            <li>Check if your WiFi SSID and password are correct</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Step-by-Step Troubleshooting</h4>
          <ol className="text-xs space-y-1 list-decimal pl-4">
            <li>Close any other applications that might be using the serial port</li>
            <li>Upload the latest sketch to your Arduino board</li>
            <li>Open the Serial Monitor in Arduino IDE to verify it's outputting data</li>
            <li>Close the Serial Monitor (important - only one application can use the port at a time)</li>
            <li>Refresh this page and try connecting again</li>
          </ol>
        </div>
        
        <div className="flex gap-2">
          {onScanPorts && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onScanPorts}
              className="text-xs"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Scan for Ports
            </Button>
          )}
          
          {onReconnect && (
            <Button 
              size="sm" 
              onClick={onReconnect}
              className="text-xs"
            >
              Reconnect
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>WiFi Configuration Format: <code>WIFI:[SSID]:[PASSWORD]</code></p>
          <p>Example: <code>WIFI:MyHomeNetwork:MySecretPassword</code></p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
