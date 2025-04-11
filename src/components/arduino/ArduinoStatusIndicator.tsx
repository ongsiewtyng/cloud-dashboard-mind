
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
      <div className={`p-4 rounded-md border ${isConnected ? 'bg-green-50 border-green-200 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <div className="bg-green-100 text-green-800 p-2 rounded-full">
                  <Wifi className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Connected</p>
                  <p className="text-sm text-green-700">Receiving data from Arduino</p>
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
        
        <div className={`p-3 rounded-md ${isConnected ? 'bg-white border border-green-100' : 'bg-white border border-slate-100'}`}>
          <p className="text-sm">
            {isConnected 
              ? "Arduino data stream is active. New readings will appear in real-time."
              : "Click 'Start Monitoring' to begin receiving data from the Arduino."}
          </p>
          
          {isConnected && (
            <p className="text-xs mt-1 text-green-700">
              Connection established at {currentTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
