
import { useState, useEffect } from "react";
import { getRandomDowntimeReason, getCurrentTimeString } from "@/utils/signalUtils";
import { 
  addSignalLog, 
  subscribeToSignalLogs, 
  updateSignalLogReason,
  type SignalLog 
} from "@/lib/signal-service";

export function useSignalSimulation(selectedMachine: string | null) {
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1");
  
  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Subscribe to real-time signal logs when a machine is selected
  useEffect(() => {
    if (!selectedMachine) {
      setSignalLogs([]);
      setIsSimulating(false);
      return;
    }

    console.log("Subscribing to signal logs for machine:", selectedMachine);
    const unsubscribe = subscribeToSignalLogs(selectedMachine, (logs) => {
      setSignalLogs(logs);
      // Set last status based on most recent log
      if (logs.length > 0) {
        setLastStatus(logs[0].status);
      }
    });

    // Start simulation
    setIsSimulating(true);
    
    return () => {
      console.log("Unsubscribing from signal logs");
      unsubscribe();
    };
  }, [selectedMachine]);

  // Check if current time is within the timeline boundaries
  const isWithinTimelineBounds = () => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  };

  // Function to add a signal log
  const addSignalLogToService = async (machineId: string, status: "0" | "1", autoReason?: string) => {
    if (!machineId) return false;
    
    let reason = status === "1" ? "" : newLogReason;

    if (autoReason && status === "0") {
      reason = autoReason;
    }

    // Format timestamp in HH:MM:SS format
    const timestamp = getCurrentTimeString();

    // Add log to Firebase
    const result = await addSignalLog(machineId, status, timestamp, reason);
    
    if (result) {
      setNewLogReason("");
      setLastStatus(status);
      return true;
    }
    
    return false;
  };

  // Real-time simulation effect - runs only when isSimulating is true
  useEffect(() => {
    let simulationInterval: number | null = null;
    
    if (isSimulating && selectedMachine) {
      console.log("Starting real-time simulation for machine:", selectedMachine);
      
      // Initial status check based on time of day
      const checkInitialStatus = async () => {
        // Only start if within timeline bounds
        if (isWithinTimelineBounds()) {
          // Check if we already have logs for today
          if (signalLogs.length === 0) {
            // 90% chance to start running for better UX
            const initialStatus = Math.random() > 0.1 ? "1" : "0";
            
            if (initialStatus === "0") {
              await addSignalLogToService(selectedMachine, initialStatus, getRandomDowntimeReason());
            } else {
              await addSignalLogToService(selectedMachine, initialStatus);
            }
          }
        }
      };
      
      // Initial check
      checkInitialStatus();
      
      // Set up timer for status changes
      simulationInterval = window.setInterval(() => {
        // Only run simulation if time is within bounds
        if (isWithinTimelineBounds()) {
          // More realistic simulation with longer running times:
          // - If running, only 5% chance to stop (machines should run much longer)
          // - If stopped, 80% chance to start (downtime should be shorter)
          let randomStatus: "0" | "1";
          
          if (lastStatus === "1") {
            // If was running, very low chance to stop (5%)
            randomStatus = Math.random() < 0.05 ? "0" : "1"; 
          } else {
            // If was stopped, high chance to start (80%)
            randomStatus = Math.random() < 0.8 ? "1" : "0";
          }
          
          // Only change status if different from current
          if (randomStatus !== lastStatus) {
            // Generate random reason for downtime
            if (randomStatus === "0") {
              addSignalLogToService(selectedMachine, randomStatus, getRandomDowntimeReason());
            } else {
              addSignalLogToService(selectedMachine, randomStatus);
            }
          }
        }
      }, Math.floor(Math.random() * 15000) + 30000); // Longer intervals: 30-45 seconds
    }
    
    return () => {
      if (simulationInterval) {
        console.log("Stopping simulation");
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, selectedMachine, lastStatus, signalLogs.length]);

  // Update a log's reason
  const updateLogReason = async (logId: string, reason: string) => {
    const success = await updateSignalLogReason(logId, reason);
    if (success) {
      setNewLogReason("");
    }
    return success;
  };

  return {
    signalLogs,
    newLogReason,
    setNewLogReason,
    addSignalLog: addSignalLogToService,
    updateLogReason,
    lastStatus
  };
}
