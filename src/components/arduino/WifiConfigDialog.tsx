
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RefreshCw, Wifi, WifiOff, AlertTriangle, Signal, SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// WiFi configuration form schema
const wifiFormSchema = z.object({
  ssid: z.string().min(1, "SSID is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type WifiFormValues = z.infer<typeof wifiFormSchema>;

interface NetworkInfo {
  ssid: string;
  strength?: number; // Signal strength in dBm
}

interface WifiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitConfig: (config: WifiFormValues) => void;
  availableNetworks?: string[] | NetworkInfo[]; // Optional list of detected networks
  isConnected?: boolean; // Whether Arduino is connected
  onScanNetworks?: () => void; // Optional callback to trigger network scan
}

export function WifiConfigDialog({ 
  open, 
  onOpenChange, 
  onSubmitConfig,
  availableNetworks = [],
  isConnected = false,
  onScanNetworks
}: WifiConfigDialogProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [formattedNetworks, setFormattedNetworks] = useState<NetworkInfo[]>([]);

  // Format networks to a consistent structure
  useEffect(() => {
    if (availableNetworks.length > 0) {
      if (typeof availableNetworks[0] === 'string') {
        // Convert string[] to NetworkInfo[]
        setFormattedNetworks(
          (availableNetworks as string[]).map(ssid => ({ ssid }))
        );
      } else {
        // Already in NetworkInfo format
        setFormattedNetworks(availableNetworks as NetworkInfo[]);
      }
      setIsScanning(false);
    }
  }, [availableNetworks]);

  // Form for WiFi configuration
  const form = useForm<WifiFormValues>({
    resolver: zodResolver(wifiFormSchema),
    defaultValues: {
      ssid: selectedNetwork || "",
      password: "",
    },
  });

  // Auto-focus password field when a network is selected
  useEffect(() => {
    if (selectedNetwork && open) {
      // Wait for next render cycle
      setTimeout(() => {
        const passwordField = document.querySelector('input[name="password"]') as HTMLInputElement;
        if (passwordField) {
          passwordField.focus();
        }
      }, 100);
    }
  }, [selectedNetwork, open]);

  // Update form when a network is selected
  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    form.setValue("ssid", network);
    // Clear validation errors for SSID
    form.clearErrors("ssid");
  };

  const handleScanNetworks = () => {
    setIsScanning(true);
    if (onScanNetworks) {
      onScanNetworks();
      // If no networks appear after 5 seconds, stop scanning animation
      setTimeout(() => setIsScanning(false), 5000);
    } else {
      // If no scan function provided, simulate scanning
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const onSubmitWifiConfig = (data: WifiFormValues) => {
    onSubmitConfig(data);
    // Don't reset the form - user may need to try again
  };

  // Get signal strength icon based on dBm value
  const getSignalIcon = (strength?: number) => {
    if (!strength) return <Signal className="h-3 w-3" />;
    if (strength > -60) return <SignalHigh className="h-3 w-3 text-green-600" />;
    if (strength > -75) return <SignalMedium className="h-3 w-3 text-yellow-600" />;
    return <SignalLow className="h-3 w-3 text-red-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Arduino WiFi</DialogTitle>
          <DialogDescription>
            Select a WiFi network for your Arduino to connect to.
            {isConnected ? "" : " Connect your Arduino via USB first."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitWifiConfig)} className="space-y-4">
            {/* Network Selection UI - Grid of available networks */}
            <div className="space-y-2 mb-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Available WiFi Networks</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleScanNetworks}
                  disabled={!isConnected || isScanning}
                >
                  {isScanning ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Scan
                </Button>
              </div>
              
              {formattedNetworks.length > 0 ? (
                <ScrollArea className="h-36 border rounded-md">
                  <div className="p-2 grid gap-2">
                    {formattedNetworks.map((network) => (
                      <Button
                        key={network.ssid}
                        type="button"
                        size="sm"
                        variant={selectedNetwork === network.ssid ? "default" : "outline"}
                        onClick={() => handleNetworkSelect(network.ssid)}
                        className="justify-start h-auto py-3 px-3"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center">
                            <Wifi className="h-3 w-3 mr-2" />
                            <span className="text-xs">{network.ssid}</span>
                          </div>
                          {getSignalIcon(network.strength)}
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              ) : isScanning ? (
                <div className="flex flex-col items-center justify-center h-36 border rounded-md bg-slate-50">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">Scanning for networks...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 border rounded-md bg-slate-50">
                  <WifiOff className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No networks found</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2" 
                    onClick={handleScanNetworks}
                    disabled={!isConnected}
                  >
                    Scan for networks
                  </Button>
                </div>
              )}
            </div>
            
            {/* Manual Network Entry Option */}
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
                    Select from above or enter manually
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
            
            {!isConnected && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Arduino Not Connected</AlertTitle>
                <AlertDescription className="text-xs">
                  Your Arduino is not currently connected. Please connect your Arduino 
                  via USB and press "Start Monitoring" before configuring WiFi.
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={!isConnected}
                title={!isConnected ? "Connect Arduino first" : "Save configuration"}
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
