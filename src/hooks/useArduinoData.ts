
import { useState, useEffect, useCallback, useRef } from "react";
import { ArduinoData, saveArduinoData, getArduinoData, processArduinoData, clearArduinoData } from "@/lib/arduino-service";
import { toast } from "sonner";

// WebSocket connection URL - configurable for different environments
const WEBSOCKET_URL = import.meta.env.VITE_ARDUINO_WEBSOCKET_URL || "ws://localhost:8080";

// Serial port connection options
const SERIAL_BAUD_RATE = 115200;

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
  const serialPortRef = useRef<any>(null);

  // Function to handle incoming Arduino data
  const handleArduinoData = useCallback((data: ArduinoData) => {
    console.log("Received Arduino data:", data);
    setArduinoData(prev => [...prev, data]);
    saveArduinoData(data);
  }, []);

  // Function to send WiFi configuration to Arduino
  const sendWifiConfig = useCallback(async (ssid: string, password: string) => {
    // First try to send via Serial if connected
    if (serialPortRef.current) {
      try {
        console.log("Sending WiFi config via Serial");
        const writer = serialPortRef.current.writable.getWriter();
        const encoder = new TextEncoder();
        const configString = `WIFI:${ssid}:${password}\n`;
        await writer.write(encoder.encode(configString));
        writer.releaseLock();
        toast.success(`WiFi configuration sent to Arduino: ${ssid}`);
        return true;
      } catch (err) {
        console.error("Error sending WiFi config via Serial:", err);
      }
    }
    
    // If Serial failed or not connected, try WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending WiFi config via WebSocket");
      const config = {
        type: "wifi_config",
        ssid,
        password
      };
      websocketRef.current.send(JSON.stringify(config));
      toast.success(`WiFi configuration sent to Arduino: ${ssid}`);
      return true;
    } 
    
    // If we got here, neither connection method worked
    console.log("No connection available to send WiFi config");
    toast.error("Cannot send WiFi configuration: Arduino not connected");
    return false;
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

  // Define the Serial API type to avoid TypeScript errors
  interface SerialPort {
    open: (options: { baudRate: number }) => Promise<void>;
    readable: ReadableStream;
    writable: WritableStream;
    close: () => Promise<void>;
  }

  interface SerialPortRequestOptions {
    filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
  }

  interface NavigatorWithSerial extends Navigator {
    serial: {
      requestPort: (options?: SerialPortRequestOptions) => Promise<SerialPort>;
      getPorts: () => Promise<SerialPort[]>;
    };
  }
  
  // Try to connect directly via Serial API if available in browser
  const startSerialConnection = useCallback(async () => {
    try {
      // Check if Web Serial API is available
      if (!('serial' in navigator)) {
        console.log("Web Serial API not available, trying WebSocket");
        return false;
      }

      // Prompt user to select serial port
      console.log("Requesting serial port access...");
      const navigatorWithSerial = navigator as NavigatorWithSerial;
      const port = await navigatorWithSerial.serial.requestPort();
      await port.open({ baudRate: SERIAL_BAUD_RATE });

      console.log("Serial port opened successfully");
      setIsConnected(true);
      setError(null);

      // Set up the reader and read loop
      const reader = port.readable.getReader();
      let decoder = new TextDecoder();
      let buffer = "";

      // Read loop function
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              console.log("Serial connection closed");
              break;
            }
            
            // Decode the received bytes and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.substring(0, newlineIndex).trim();
              buffer = buffer.substring(newlineIndex + 1);
              
              if (line.length > 0) {
                console.log("Serial data received:", line);
                
                try {
                  // Try to parse as JSON
                  const jsonData = JSON.parse(line);
                  
                  // Handle different message types
                  if (jsonData.type === "wifi_status") {
                    setWifiStatus({
                      connected: jsonData.connected,
                      networks: jsonData.networks || [],
                      ssid: jsonData.ssid,
                      strength: jsonData.signal_strength
                    });
                    console.log("WiFi status updated:", jsonData);
                  } else {
                    // Process as Arduino data
                    const data = processArduinoData(line);
                    if (data) {
                      handleArduinoData(data);
                    }
                  }
                } catch (parseErr) {
                  console.warn("Non-JSON data:", line);
                  // Check if it's a WiFi configuration command response
                  if (line.startsWith("WiFi status:") || line.includes("networks found")) {
                    console.log("WiFi info received:", line);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error reading from serial:", err);
          setError(`Serial reading error: ${err.message}`);
          setIsConnected(false);
        } finally {
          reader.releaseLock();
        }
      };

      // Start the read loop
      readLoop();

      // Send command to scan WiFi networks
      if (port.writable) {
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode("SCAN_WIFI\n"));
        await writer.write(encoder.encode("WIFI_STATUS\n"));
        writer.releaseLock();
      }

      // Store port in ref for later use
      serialPortRef.current = port;
      return true;
    } catch (err) {
      console.error("Serial connection error:", err);
      setError(`Failed to connect: ${err.message}`);
      return false;
    }
  }, [handleArduinoData]);

  // Start WebSocket connection to Arduino bridge
  const startWebSocketConnection = useCallback(() => {
    try {
      console.log("Attempting WebSocket connection to:", WEBSOCKET_URL);
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
          console.log("WebSocket message received:", event.data);
          
          // Try to parse as JSON first
          try {
            const message = JSON.parse(event.data);
            
            // Handle different message types
            if (message.type === "wifi_status") {
              setWifiStatus({
                connected: message.connected,
                networks: message.networks || [],
                ssid: message.ssid,
                strength: message.strength
              });
              console.log("WiFi status updated from WebSocket");
            } else if (message.type === "data") {
              const data = processArduinoData(JSON.stringify(message.data));
              if (data) {
                handleArduinoData(data);
              }
            } else if (message.type === "error") {
              console.error("Arduino error:", message.message);
              toast.error(`Arduino error: ${message.message}`);
            } else {
              // Process legacy format
              const data = processArduinoData(event.data);
              if (data) {
                handleArduinoData(data);
              }
            }
          } catch (jsonErr) {
            // Not JSON, try as raw data
            const data = processArduinoData(event.data);
            if (data) {
              handleArduinoData(data);
            } else {
              console.log("Unprocessable WebSocket data:", event.data);
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
      return true;
    } catch (err) {
      console.error("Error starting WebSocket connection:", err);
      setError("Failed to connect to Arduino");
      return false;
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
  const startListening = useCallback(async () => {
    try {
      console.log("Starting Arduino monitoring...");
      
      // Try Serial connection first if available
      let connected = false;
      
      try {
        if ('serial' in navigator) {
          console.log("Trying Serial API connection...");
          connected = await startSerialConnection();
          if (connected) {
            console.log("Serial connection successful");
            toast.success("Connected to Arduino via Serial");
            return;
          }
        }
      } catch (serialErr) {
        console.error("Serial connection failed:", serialErr);
      }
      
      // If Serial fails or isn't available, try WebSocket
      if (!connected) {
        console.log("Trying WebSocket connection...");
        connected = startWebSocketConnection();
        if (connected) {
          console.log("WebSocket connection successful");
          toast.success("Connected to Arduino via WebSocket");
          return;
        }
      }
      
      // If both failed, start simulation mode
      if (!connected) {
        console.log("All connection methods failed, starting simulation");
        toast.warning("Connection failed. Starting simulation mode.");
        startSimulation();
      }
    } catch (err) {
      console.error("Error starting Arduino monitoring:", err);
      setError("Failed to start monitoring");
      startSimulation(); // Fall back to simulation mode
    }
  }, [startSerialConnection, startWebSocketConnection, startSimulation]);

  // Stop listening for Arduino data
  const stopListening = useCallback(async () => {
    // Clean up WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Clean up Serial connection if active
    if (serialPortRef.current) {
      try {
        await serialPortRef.current.close();
        console.log("Serial port closed");
      } catch (err) {
        console.error("Error closing serial port:", err);
      }
      serialPortRef.current = null;
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

  // Function to scan for available WiFi networks
  const scanWifiNetworks = useCallback(async () => {
    console.log("Scanning for WiFi networks...");
    
    // Try to send scan command through Serial if connected
    if (serialPortRef.current) {
      try {
        const writer = serialPortRef.current.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode("SCAN_WIFI\n"));
        writer.releaseLock();
        return true;
      } catch (err) {
        console.error("Error sending WiFi scan command:", err);
        return false;
      }
    }
    
    // Try to send scan command through WebSocket if connected
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        websocketRef.current.send(JSON.stringify({ type: "scan_wifi" }));
        return true;
      } catch (err) {
        console.error("Error sending WiFi scan command via WebSocket:", err);
        return false;
      }
    }
    
    return false;
  }, []);

  return {
    arduinoData,
    isConnected,
    wifiStatus,
    error,
    startListening,
    stopListening,
    clearData,
    sendWifiConfig,
    scanWifiNetworks
  };
}
