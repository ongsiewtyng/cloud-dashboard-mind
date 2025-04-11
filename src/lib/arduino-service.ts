
import { ref, push, get, child, getDatabase } from "firebase/database";
import { db } from "@/lib/firebase";

// Define Arduino data structure
export interface ArduinoData {
  id?: string;
  timestamp: string;
  machineState: string;
  runTime: string;
  recordedAt: number;
}

// Firebase reference for Arduino data
const arduinoDataRef = ref(db, "arduinoData");

/**
 * Save Arduino data to Firebase
 */
export const saveArduinoData = async (data: Omit<ArduinoData, "id" | "recordedAt">): Promise<string | null> => {
  try {
    const newDataRef = push(arduinoDataRef);
    const dataWithTimestamp: ArduinoData = {
      ...data,
      recordedAt: Date.now()
    };

    await push(arduinoDataRef, dataWithTimestamp);
    console.log("Arduino data saved:", dataWithTimestamp);
    return newDataRef.key;
  } catch (error) {
    console.error("Error saving Arduino data:", error);
    return null;
  }
};

/**
 * Get all Arduino data
 */
export const getArduinoData = async (): Promise<ArduinoData[]> => {
  try {
    const snapshot = await get(arduinoDataRef);
    if (!snapshot.exists()) return [];
    
    const data: ArduinoData[] = [];
    snapshot.forEach((childSnapshot) => {
      const childData = childSnapshot.val();
      data.push({
        id: childSnapshot.key || "",
        ...childData
      });
    });
    
    // Sort by timestamp
    return data.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
  } catch (error) {
    console.error("Error getting Arduino data:", error);
    return [];
  }
};

/**
 * Process raw Arduino data from serial/WebSocket
 */
export const processArduinoData = (rawData: string): ArduinoData | null => {
  try {
    console.log("Processing Arduino data:", rawData);
    
    // Try to parse as JSON first
    try {
      const data = JSON.parse(rawData);
      
      // Check if it's a sensor reading format (new format from Arduino)
      if (data.type === "sensor_reading") {
        console.log("Found sensor reading data:", data);
        return {
          timestamp: Date.now().toString(),
          machineState: data.active ? "True" : "False",
          runTime: data.timestamp ? data.timestamp.toString() : "0",
          recordedAt: Date.now()
        };
      }
      
      // Validate standard format fields
      if (!data.timestamp && !data.machineState && !data.runTime) {
        // Try to extract data from button field if it exists
        if (data.value !== undefined) {
          const sensorValue = typeof data.value === 'number' ? data.value : parseInt(data.value);
          return {
            timestamp: Date.now().toString(),
            machineState: sensorValue > 500 ? "True" : "False",
            runTime: "0",
            recordedAt: Date.now()
          };
        }
        
        console.error("Invalid Arduino data format:", data);
        return null;
      }
      
      return {
        timestamp: data.timestamp.toString(),
        machineState: data.machineState,
        runTime: data.runTime.toString(),
        recordedAt: Date.now()
      };
    } catch (jsonError) {
      console.log("JSON parse error, trying alternative formats:", jsonError.message);
      
      // Check if it's a Button Pressed/Released message
      if (rawData.includes("Button Pressed") || rawData.includes("Button Released")) {
        console.log("Found button state message:", rawData);
        const isPressed = rawData.includes("Button Pressed");
        return {
          timestamp: Date.now().toString(),
          machineState: isPressed ? "True" : "False",
          runTime: "0",
          recordedAt: Date.now()
        };
      }
      
      // Check if it's a raw sensor value (e.g., "Sensor Value: 104")
      if (rawData.includes("Sensor Value:")) {
        const sensorValueMatch = rawData.match(/Sensor Value:\s*(\d+)/);
        if (sensorValueMatch && sensorValueMatch[1]) {
          const sensorValue = parseInt(sensorValueMatch[1]);
          console.log("Found sensor value:", sensorValue);
          // Create a synthetic data point based on the sensor value
          return {
            timestamp: Date.now().toString(),
            machineState: sensorValue > 500 ? "True" : "False", // Use the same threshold as Arduino code
            runTime: "0", // We don't have runtime for raw sensors, so use 0
            recordedAt: Date.now()
          };
        }
      }
      
      // If we couldn't parse using any method, return null
      console.log("Could not parse data:", rawData);
      return null;
    }
  } catch (error) {
    console.error("Error processing Arduino data:", error);
    return null;
  }
};

/**
 * Clear all Arduino data
 */
export const clearArduinoData = async (): Promise<boolean> => {
  try {
    await push(arduinoDataRef, null);
    return true;
  } catch (error) {
    console.error("Error clearing Arduino data:", error);
    return false;
  }
};
