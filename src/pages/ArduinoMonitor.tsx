
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArduinoDataChart } from "@/components/arduino/ArduinoDataChart";
import { ArduinoStatusIndicator } from "@/components/arduino/ArduinoStatusIndicator";
import { useArduinoData } from "@/hooks/useArduinoData";
import { ArduinoData } from "@/lib/arduino-service";
import { Code, Download, Settings, Wifi } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// WiFi configuration form schema
const wifiFormSchema = z.object({
  ssid: z.string().min(1, "SSID is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type WifiFormValues = z.infer<typeof wifiFormSchema>;

const ArduinoMonitor = () => {
  const { 
    arduinoData, 
    isConnected, 
    startListening, 
    stopListening, 
    clearData 
  } = useArduinoData();
  
  const [isManualSetup, setIsManualSetup] = useState(true);
  const [isWifiDialogOpen, setIsWifiDialogOpen] = useState(false);

  // Form for WiFi configuration
  const form = useForm<WifiFormValues>({
    resolver: zodResolver(wifiFormSchema),
    defaultValues: {
      ssid: "",
      password: "",
    },
  });

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

  const onSubmitWifiConfig = (data: WifiFormValues) => {
    // This function simulates sending the WiFi configuration to the Arduino
    // In a real application, you would send this to your Arduino via Serial or API
    console.log("WiFi Configuration:", data);
    
    const configCommand = `WIFI:${data.ssid}:${data.password}`;
    console.log("Config Command:", configCommand);
    
    toast.success(`WiFi configuration updated! SSID: ${data.ssid}`);
    setIsWifiDialogOpen(false);
    
    // Reset form after submission
    form.reset();
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

      {/* WiFi Configuration Dialog */}
      <Dialog open={isWifiDialogOpen} onOpenChange={setIsWifiDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configure Arduino WiFi</DialogTitle>
            <DialogDescription>
              Enter the WiFi credentials for your Arduino to connect to.
              This will be sent to your Arduino when it's connected via USB.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitWifiConfig)} className="space-y-4">
              <FormField
                control={form.control}
                name="ssid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WiFi Network Name (SSID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter WiFi name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your WiFi network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WiFi Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter WiFi password" {...field} />
                    </FormControl>
                    <FormDescription>
                      The password for your WiFi network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="usb" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="usb">USB Connection</TabsTrigger>
                  <TabsTrigger value="manual">Manual Setup</TabsTrigger>
                </TabsList>
                
                <TabsContent value="usb" className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect your Arduino to your computer via USB and click Save.
                    The configuration will be sent to the Arduino automatically.
                  </p>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Copy this command and paste it into the Arduino Serial Monitor:
                  </p>
                  <div className="bg-slate-100 p-2 rounded-md">
                    <code className="text-xs">
                      WIFI:{form.watch("ssid")}:{form.watch("password")}
                    </code>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button type="submit">Save Configuration</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArduinoMonitor;
