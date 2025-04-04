
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArduinoDataChart } from "@/components/arduino/ArduinoDataChart";
import { ArduinoStatusIndicator } from "@/components/arduino/ArduinoStatusIndicator";
import { useArduinoData } from "@/hooks/useArduinoData";
import { ArduinoData } from "@/lib/arduino-service";

const ArduinoMonitor = () => {
  const { 
    arduinoData, 
    isConnected, 
    startListening, 
    stopListening, 
    clearData 
  } = useArduinoData();
  
  const [isManualSetup, setIsManualSetup] = useState(true);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Arduino Machine Monitor</h1>
        <div className="flex gap-4">
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
                <li>Connect Arduino to your computer</li>
                <li>Use the URL parameter ?autoConnect=true for automatic connection</li>
                <li>Or click "Start Monitoring" to begin receiving data</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Machine State</CardTitle>
          </CardHeader>
          <CardContent>
            <ArduinoDataChart data={arduinoData.slice(-20)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arduino Data Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Machine State</TableHead>
                  <TableHead>Runtime (seconds)</TableHead>
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arduinoData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No data received yet. Start monitoring to see data.
                    </TableCell>
                  </TableRow>
                ) : (
                  arduinoData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.timestamp}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          data.machineState === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {data.machineState === 'True' ? 'Running' : 'Stopped'}
                        </span>
                      </TableCell>
                      <TableCell>{data.runTime}</TableCell>
                      <TableCell>{new Date(data.recordedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arduino Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-medium">Arduino Code Example (upload this to your Arduino):</h3>
            <pre className="bg-slate-100 p-4 rounded-md overflow-x-auto text-sm">
{`#include <ArduinoJson.h>

// Your machine monitoring pins
const int machineSensorPin = 2;  
unsigned long lastTimestamp = 0;
unsigned long runTime = 0;
boolean machineState = false;

void setup() {
  Serial.begin(9600);
  pinMode(machineSensorPin, INPUT);
  Serial.println("Machine monitoring started");
}

void loop() {
  // Read machine state
  boolean currentState = digitalRead(machineSensorPin) == HIGH;
  
  // Update runtime
  runTime += 1;
  
  // Get current timestamp (millis since start)
  unsigned long currentTimestamp = millis();
  
  // Check if state changed or if 5 seconds passed
  if (currentState != machineState || currentTimestamp - lastTimestamp >= 5000) {
    machineState = currentState;
    lastTimestamp = currentTimestamp;
    
    // Create JSON document
    StaticJsonDocument<128> doc;
    doc["timestamp"] = currentTimestamp;
    doc["machineState"] = machineState ? "True" : "False";
    doc["runTime"] = runTime;
    
    // Serialize JSON to Serial
    serializeJson(doc, Serial);
    Serial.println();
  }
  
  delay(1000);  // Update every second
}`}
            </pre>

            <h3 className="font-medium mt-2">To connect the Arduino to this dashboard:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Upload the code above to your Arduino</li>
              <li>Connect your Arduino to your computer via USB</li>
              <li>Your Arduino will send data every 5 seconds or when the machine state changes</li>
              <li>Use a serial-to-WebSocket bridge app (like Arduino Web Interface or SerialPort-to-WebSocket)</li>
              <li>Or you can visit this page with ?autoConnect=true to simulate data reception</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArduinoMonitor;
