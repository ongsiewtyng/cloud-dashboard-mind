
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
    const data = JSON.parse(rawData);
    
    // Validate required fields
    if (!data.timestamp || !data.machineState || !data.runTime) {
      console.error("Invalid Arduino data format:", data);
      return null;
    }
    
    return {
      timestamp: data.timestamp.toString(),
      machineState: data.machineState,
      runTime: data.runTime.toString(),
      recordedAt: Date.now()
    };
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
