
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wifi, WifiOff, Clock, ActivitySquare, CircuitBoard, Zap } from "lucide-react";

interface ArduinoStatusIndicatorProps {
  isConnected: boolean;
  wifiStatus?: {
    connected: boolean;
    ssid?: string;
    strength?: number;
  };
}

export function ArduinoStatusIndicator({ 
  isConnected, 
  wifiStatus = { connected: false } 
}: ArduinoStatusIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionTime, setConnectionTime] = useState<Date | null>(null);
  
  // Set connection time when device connects
  useEffect(() => {
    if (isConnected && !connectionTime) {
      setConnectionTime(new Date());
    } else if (!isConnected) {
      setConnectionTime(null);
    }
  }, [isConnected, connectionTime]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get active icon based on connection state and sensor activity
  const getStatusIcon = () => {
    if (!isConnected) {
      return <CircuitBoard className="h-6 w-6" />;
    }
    
    if (wifiStatus.connected) {
      return <Wifi className="h-6 w-6" />;
    }
    
    return <ActivitySquare className="h-6 w-6" />;
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className={`p-4 rounded-md border ${
        isConnected 
          ? wifiStatus.connected 
            ? 'bg-green-50 border-green-200 animate-pulse' 
            : 'bg-blue-50 border-blue-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                <div className={`${
                  wifiStatus.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                } p-2 rounded-full`}>
                  {getStatusIcon()}
                </div>
                <div>
                  <p className={`font-medium ${
                    wifiStatus.connected 
                      ? 'text-green-900' 
                      : 'text-blue-900'
                  }`}>
                    {wifiStatus.connected ? 'Connected via WiFi' : 'Connected via USB'}
                  </p>
                  <p className={`text-sm ${
                    wifiStatus.connected 
                      ? 'text-green-700' 
                      : 'text-blue-700'
                  }`}>
                    {wifiStatus.connected 
                      ? `Connected to ${wifiStatus.ssid || 'WiFi network'}` 
                      : 'Receiving data via USB connection'}
                  </p>
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
        
        <div className={`p-3 rounded-md ${
          isConnected 
            ? wifiStatus.connected 
              ? 'bg-white border border-green-100' 
              : 'bg-white border border-blue-100'
            : 'bg-white border border-slate-100'
        }`}>
          <p className="text-sm flex items-center">
            {isConnected && (
              <Zap className={`h-4 w-4 mr-1 ${wifiStatus.connected ? 'text-green-500' : 'text-blue-500'}`} />
            )} 
            {isConnected 
              ? wifiStatus.connected
                ? "Arduino connected wirelessly. Data is being received in real-time."
                : "Arduino connected via USB. Data is being received in real-time."
              : "Click 'Start Monitoring' to begin receiving data from the Arduino."}
          </p>
          
          {isConnected && connectionTime && (
            <p className="text-xs mt-1 text-green-700">
              Connection established at {connectionTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
