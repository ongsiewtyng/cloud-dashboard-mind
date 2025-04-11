
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wifi, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// WiFi configuration form schema
const wifiFormSchema = z.object({
  ssid: z.string().min(1, "SSID is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type WifiFormValues = z.infer<typeof wifiFormSchema>;

interface WifiConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitConfig: (config: WifiFormValues) => void;
  availableNetworks?: string[]; // Optional list of detected networks
  isConnected?: boolean; // Whether Arduino is connected
}

export function WifiConfigDialog({ 
  open, 
  onOpenChange, 
  onSubmitConfig,
  availableNetworks = [],
  isConnected = false
}: WifiConfigDialogProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  // Form for WiFi configuration
  const form = useForm<WifiFormValues>({
    resolver: zodResolver(wifiFormSchema),
    defaultValues: {
      ssid: selectedNetwork || "",
      password: "",
    },
  });

  // Update form when a network is selected
  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network);
    form.setValue("ssid", network);
  };

  const onSubmitWifiConfig = (data: WifiFormValues) => {
    onSubmitConfig(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  {availableNetworks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Available networks:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableNetworks.map((network) => (
                          <Button
                            key={network}
                            type="button"
                            size="sm"
                            variant={selectedNetwork === network ? "default" : "outline"}
                            onClick={() => handleNetworkSelect(network)}
                          >
                            <Wifi className="h-3 w-3 mr-1" />
                            {network}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
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
