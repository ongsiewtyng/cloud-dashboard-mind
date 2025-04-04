
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArduinoDataChart } from "@/components/arduino/ArduinoDataChart";
import { ArduinoStatusIndicator } from "@/components/arduino/ArduinoStatusIndicator";
import { useArduinoData } from "@/hooks/useArduinoData";
import { ArduinoData } from "@/lib/arduino-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Download, Info } from "lucide-react";

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
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleDownloadCode}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Arduino Code
              </Button>
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
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Arduino Integration Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions">
            <TabsList className="mb-4">
              <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
              <TabsTrigger value="code"><Code className="h-4 w-4 mr-2" /> Arduino Code</TabsTrigger>
              <TabsTrigger value="bridge">Connection Bridge</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions" className="space-y-4">
              <h3 className="font-medium">How to connect your Arduino:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Download the Arduino code from the button above or copy it from the "Arduino Code" tab</li>
                <li>Upload the code to your Arduino using the Arduino IDE</li>
                <li>Connect your Arduino to your computer via USB</li>
                <li>Run the Python bridge script (see "Connection Bridge" tab) to connect your Arduino to this dashboard</li>
                <li>Alternatively, use the WebSocket version of the code if your Arduino has WiFi capabilities</li>
              </ol>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                <h4 className="font-medium text-amber-800">Important Notes:</h4>
                <ul className="list-disc pl-5 mt-2 text-amber-700 space-y-1">
                  <li>Make sure to install the ArduinoJson library (Sketch &gt; Include Library &gt; Manage Libraries...)</li>
                  <li>The default code assumes your machine signal is connected to digital pin 2</li>
                  <li>Set your machine signal pin HIGH when the machine is running and LOW when stopped</li>
                  <li>For direct WebSocket connections, you'll need an ESP8266 or ESP32-based Arduino with WiFi</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <div className="bg-slate-100 p-4 rounded-md overflow-x-auto text-sm">
                <pre className="whitespace-pre-wrap">
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
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={handleDownloadCode}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Arduino Code
              </Button>
            </TabsContent>
            
            <TabsContent value="bridge" className="space-y-4">
              <h3 className="font-medium">Connection Bridge:</h3>
              <p>
                To connect your Arduino to this dashboard, you'll need a bridge application
                that forwards data from the Arduino's serial port to a WebSocket connection.
                We've provided a Python script for this purpose.
              </p>
              
              <div className="bg-slate-100 p-4 rounded-md overflow-x-auto text-sm mt-4">
                <h4 className="font-medium mb-2">Running the Python bridge:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Make sure you have Python 3.6+ installed</li>
                  <li>Install required packages: <code>pip install pyserial websocket-client</code></li>
                  <li>Download the bridge script from the source code or copy from the repository</li>
                  <li>Run the script: <code>python arduino_bridge.py</code></li>
                  <li>The script will automatically detect your Arduino and connect to it</li>
                  <li>If it doesn't, specify the port: <code>python arduino_bridge.py --port COM3</code> (Windows) or <code>--port /dev/ttyUSB0</code> (Linux)</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <h4 className="font-medium text-blue-800">Alternative Connection Methods:</h4>
                <ul className="list-disc pl-5 mt-2 text-blue-700 space-y-2">
                  <li>
                    <span className="font-medium">Direct WebSocket:</span> If you have an ESP8266 or ESP32-based Arduino, 
                    you can use the WebSocket code version to connect directly to your dashboard without a bridge.
                  </li>
                  <li>
                    <span className="font-medium">Serial-to-WebSocket apps:</span> There are several applications that can forward
                    serial data to WebSockets, such as "Serial Port WebSocket Server" for Windows or "WebSocket Serial Terminal" for macOS.
                  </li>
                  <li>
                    <span className="font-medium">Custom solutions:</span> You can also write your own bridge application using
                    languages like Node.js, Python, or Java.
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArduinoMonitor;
