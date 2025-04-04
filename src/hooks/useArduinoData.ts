
import { useState, useEffect, useCallback, useRef } from "react";
import { ArduinoData, saveArduinoData, getArduinoData, processArduinoData, clearArduinoData } from "@/lib/arduino-service";
import { toast } from "sonner";

// WebSocket connection URL - this would be replaced with your actual WebSocket server for Arduino
const WEBSOCKET_URL = "ws://localhost:8080";

export function useArduinoData() {
  const [arduinoData, setArduinoData] = useState<ArduinoData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [wifiStatus, setWifiStatus] = useState<{
    connected: boolean;
    networks?: string[];
    ssid?: string;
    strength?: number;
  }>({
    connected: false
  });
  const [error, setError] = useState<string | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);

  // Function to handle incoming Arduino data
  const handleArduinoData = useCallback((data: ArduinoData) => {
    console.log("Received Arduino data:", data);
    setArduinoData(prev => [...prev, data]);
    saveArduinoData(data);
  }, []);

  // Function to send WiFi configuration to Arduino
  const sendWifiConfig = useCallback((ssid: string, password: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      const config = {
        type: "wifi_config",
        ssid,
        password
      };
      websocketRef.current.send(JSON.stringify(config));
      toast.success(`WiFi configuration sent to Arduino: ${ssid}`);
      return true;
    } else {
      console.log("WebSocket not connected, can't send WiFi config");
      toast.error("Cannot send WiFi configuration: Arduino not connected");
      return false;
    }
  }, []);

  // Initialize data from Firebase on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await getArduinoData();
        if (data.length > 0) {
          setArduinoData(data);
        }
      } catch (err) {
        console.error("Error fetching initial Arduino data:", err);
      }
    };

    fetchInitialData();
  }, []);

  // Start WebSocket connection to Arduino bridge
  const startWebSocketConnection = useCallback(() => {
    try {
      // In a real implementation, this would connect to a WebSocket server
      // that bridges the serial connection from the Arduino
      const socket = new WebSocket(WEBSOCKET_URL);
      
      socket.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
        setError(null);
        
        // Request WiFi status after connection
        socket.send(JSON.stringify({ type: "request_wifi_status" }));
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          if (message.type === "wifi_status") {
            setWifiStatus({
              connected: message.connected,
              networks: message.networks,
              ssid: message.ssid,
              strength: message.strength
            });
          } else if (message.type === "data") {
            const data = processArduinoData(JSON.stringify(message.data));
            if (data) {
              handleArduinoData(data);
            }
          } else {
            // Process legacy format
            const data = processArduinoData(event.data);
            if (data) {
              handleArduinoData(data);
            }
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };
      
      socket.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnected(false);
      };
      
      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection error");
        setIsConnected(false);
      };
      
      websocketRef.current = socket;
    } catch (err) {
      console.error("Error starting WebSocket connection:", err);
      setError("Failed to connect to Arduino");
      startSimulation(); // Fall back to simulation mode
    }
  }, [handleArduinoData]);

  // Simulation mode for testing
  const startSimulation = useCallback(() => {
    console.log("Starting Arduino data simulation");
    setIsConnected(true);
    
    // Simulate WiFi status
    setWifiStatus({
      connected: true,
      networks: ["Home WiFi", "Office Network", "Guest Network"],
      ssid: "Simulated WiFi",
      strength: 75
    });
    
    // Generate random data every 3 seconds
    const interval = window.setInterval(() => {
      const now = Date.now();
      const newData: ArduinoData = {
        timestamp: now.toString(),
        machineState: Math.random() > 0.3 ? "True" : "False", // 70% chance of being on
        runTime: (Math.floor(Math.random() * 100) + 100).toString(),
        recordedAt: now
      };
      
      handleArduinoData(newData);
    }, 3000);
    
    simulationIntervalRef.current = interval;
  }, [handleArduinoData]);

  // Start listening for Arduino data
  const startListening = useCallback(() => {
    try {
      // Try WebSocket connection first
      startWebSocketConnection();
      
      // If WebSocket fails, it will automatically fall back to simulation mode
    } catch (err) {
      console.error("Error starting Arduino monitoring:", err);
      setError("Failed to start monitoring");
      startSimulation(); // Fall back to simulation mode
    }
  }, [startWebSocketConnection, startSimulation]);

  // Stop listening for Arduino data
  const stopListening = useCallback(() => {
    // Clean up WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Clean up simulation interval
    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    setIsConnected(false);
    console.log("Stopped Arduino monitoring");
  }, []);

  // Clear Arduino data
  const clearData = useCallback(async () => {
    setArduinoData([]);
    await clearArduinoData();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    arduinoData,
    isConnected,
    wifiStatus,
    error,
    startListening,
    stopListening,
    clearData,
    sendWifiConfig
  };
}
