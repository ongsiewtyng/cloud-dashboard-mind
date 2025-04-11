
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArduinoDataChart } from "@/components/arduino/ArduinoDataChart";
import { useArduinoData } from "@/hooks/useArduinoData";
import { Wifi } from "lucide-react";
import { ArduinoConnectionCard } from "@/components/arduino/ArduinoConnectionCard";
import { ArduinoDataLog } from "@/components/arduino/ArduinoDataLog";
import { WifiConfigDialog } from "@/components/arduino/WifiConfigDialog";
import { ConnectionTroubleshooting } from "@/components/arduino/ConnectionTroubleshooting";
import { RawSensorDataLog } from "@/components/arduino/RawSensorDataLog";

const ArduinoMonitor = () => {
  const { 
    arduinoData, 
    isConnected, 
    wifiStatus,
    error,
    startListening, 
    stopListening, 
    clearData,
    sendWifiConfig,
    scanWifiNetworks
  } = useArduinoData();
  
  const [isManualSetup, setIsManualSetup] = useState(true);
  const [isWifiDialogOpen, setIsWifiDialogOpen] = useState(false);

  useEffect(() => {
    // Check if URL has connection parameter
    const urlParams = new URLSearchParams(window.location.search);
    const autoConnect = urlParams.get('autoConnect');
    
    if (autoConnect === 'true') {
      setIsManualSetup(false);
      startListening();
      toast.success("Auto-connecting to Arduino data stream");
    }
  }, [startListening]);

  const handleStartMonitoring = () => {
    startListening();
    toast.success("Started monitoring Arduino data");
  };

  const handleStopMonitoring = () => {
    stopListening();
    toast.info("Stopped monitoring Arduino data");
  };

  const handleClearData = () => {
    clearData();
    toast.info("Cleared all Arduino data");
  };

  const handleDownloadCode = () => {
    // Create a download for the Arduino code
    const element = document.createElement("a");
    element.setAttribute("href", "/arduino/ArduinoMachineMonitor.ino");
    element.setAttribute("download", "ArduinoMachineMonitor.ino");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Arduino code downloaded");
  };

  const [isScanning, setIsScanning] = useState(false);
  
  const handleScanWifiNetworks = async () => {
    setIsScanning(true);
    try {
      // Request a scan from the Arduino using the hook function
      if (await scanWifiNetworks()) {
        toast.success("Scanning for WiFi networks...");
      } else {
        toast.error("Arduino not connected. Cannot scan for networks.");
      }
    } catch (err) {
      console.error("Error scanning WiFi networks:", err);
      toast.error("Failed to scan for WiFi networks");
    } finally {
      // Reset after a timeout
      setTimeout(() => setIsScanning(false), 5000);
    }
  };

  const onSubmitWifiConfig = (data: { ssid: string; password: string }) => {
    // Send WiFi configuration to Arduino
    if (sendWifiConfig(data.ssid, data.password)) {
      toast.success(`WiFi configuration updated! SSID: ${data.ssid}`);
    } else {
      toast.error("Failed to send WiFi configuration. Make sure Arduino is connected.");
    }
    // Keep dialog open to see status
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Arduino Machine Monitor</h1>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setIsWifiDialogOpen(true)}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Configure WiFi
          </Button>
          
          {isManualSetup && (
            <>
              <Button 
                onClick={handleStartMonitoring} 
                disabled={isConnected}
                variant="default"
              >
                Start Monitoring
              </Button>
              <Button 
                onClick={handleStopMonitoring} 
                disabled={!isConnected}
                variant="outline"
              >
                Stop Monitoring
              </Button>
              <Button 
                onClick={handleClearData} 
                variant="destructive"
              >
                Clear Data
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ArduinoConnectionCard 
          isConnected={isConnected} 
          onDownloadCode={handleDownloadCode}
          wifiStatus={wifiStatus}
          error={error}
        />

        <Card>
          <CardHeader>
            <CardTitle>Real-time Machine State</CardTitle>
          </CardHeader>
          <CardContent>
            <ArduinoDataChart data={arduinoData.slice(-20)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ArduinoDataLog data={arduinoData} />
        
        {/* Add Raw Sensor Data Log that directly processes sensor values */}
        <RawSensorDataLog isConnected={isConnected} />
      </div>

      {/* Add Connection Troubleshooting */}
      <div className="mt-4">
        <ConnectionTroubleshooting 
          onScanPorts={handleStartMonitoring}
          onReconnect={handleStartMonitoring}
        />
      </div>
      
      {/* WiFi Configuration Dialog */}
      <WifiConfigDialog
        open={isWifiDialogOpen}
        onOpenChange={setIsWifiDialogOpen}
        onSubmitConfig={onSubmitWifiConfig}
        availableNetworks={wifiStatus.networks}
        isConnected={isConnected}
        onScanNetworks={handleScanWifiNetworks}
      />
    </div>
  );
};

export default ArduinoMonitor;
