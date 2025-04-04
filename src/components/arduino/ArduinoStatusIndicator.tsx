
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wifi, WifiOff, Clock } from "lucide-react";

interface ArduinoStatusIndicatorProps {
  isConnected: boolean;
}

export function ArduinoStatusIndicator({ isConnected }: ArduinoStatusIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <div className="bg-green-100 text-green-800 p-2 rounded-full">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Connected</p>
                <p className="text-sm text-muted-foreground">Receiving data from Arduino</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-100 text-slate-800 p-2 rounded-full">
                <WifiOff className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Disconnected</p>
                <p className="text-sm text-muted-foreground">No Arduino connection</p>
              </div>
            </>
          )}
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {currentTime.toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className={`p-3 rounded-md ${isConnected ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-100'}`}>
        <p className="text-sm">
          {isConnected 
            ? "Arduino data stream is active. New readings will appear in real-time."
            : "Click 'Start Monitoring' to begin receiving data from the Arduino."}
        </p>
      </div>
    </div>
  );
}
