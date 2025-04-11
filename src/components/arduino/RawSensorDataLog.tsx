import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SensorReading {
  value: number;
  timestamp: Date;
  isActive: boolean;
}

interface RawSensorDataLogProps {
  isConnected: boolean;
}

export function RawSensorDataLog({ isConnected }: RawSensorDataLogProps) {
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const maxReadings = 20; // Keep only the last 20 readings
  
  // Function to add a new reading
  const addReading = (value: number) => {
    setSensorReadings(prev => {
      const newReadings = [...prev, {
        value,
        timestamp: new Date(),
        isActive: value > 500 // Same threshold as in Arduino code
      }];
      
      // Keep only the latest readings
      if (newReadings.length > maxReadings) {
        return newReadings.slice(newReadings.length - maxReadings);
      }
      return newReadings;
    });
  };
  
  // Set up console.log interceptor to catch sensor values
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      
      // Check if this is a sensor value log
      if (args.length > 0) {
        // Check for structured sensor reading JSON
        if (typeof args[0] === 'string' && args[0] === "Structured sensor reading received:" && 
            args.length > 1 && typeof args[1] === 'object') {
          try {
            const sensorData = args[1];
            if (sensorData && typeof sensorData.value === 'number') {
              addReading(sensorData.value);
            }
          } catch (err) {
            // Ignore parsing errors
          }
        }
        // Check for raw serial data with sensor value
        else if (typeof args[0] === 'string' && args[0] === "Serial data received:" && 
            args.length > 1 && typeof args[1] === 'string') {
          const dataStr = args[1];
          if (dataStr.includes('Sensor Value:')) {
            const match = dataStr.match(/Sensor Value:\s*(\d+)/);
            if (match && match[1]) {
              const value = parseInt(match[1]);
              addReading(value);
            }
          }
          
          // Try to parse it as JSON containing sensor data
          try {
            const jsonData = JSON.parse(args[1]);
            if (jsonData && jsonData.type === 'sensor_reading' && typeof jsonData.value === 'number') {
              addReading(jsonData.value);
            }
          } catch (err) {
            // Not valid JSON, ignore
          }
        }
      }
    };
    
    // Clean up
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);
  
  if (sensorReadings.length === 0 && !isConnected) {
    return null; // Don't show until we have data or are connected
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Raw Sensor Readings</span>
          {isConnected && (
            <Badge variant="outline" className="ml-2 animate-pulse">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Sensor Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensorReadings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Waiting for sensor data...
                  </TableCell>
                </TableRow>
              ) : (
                sensorReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>{reading.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell>{reading.value}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        reading.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reading.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
