import { useState, useEffect } from "react";
import { getRandomDowntimeReason, getCurrentTimeString } from "@/utils/signalUtils";
import {
  addSignalLog,
  subscribeToSignalLogs,
  updateSignalLogReason,
  updateAllLogDurations,
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

    // Update all log durations when first loading logs for a machine
    updateAllLogDurations(selectedMachine);

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

      // Update durations of all logs when a new log is added
      await updateAllLogDurations(machineId);

      return true;
    }

    return false;
  };

  // In `src/hooks/useSignalSimulation.ts`
  useEffect(() => {
    let simulationInterval: number | null = null;

    if (isSimulating && selectedMachine) {
      console.log("Starting real-time simulation for machine:", selectedMachine);

      // Initial status check based on time of day
      const checkInitialStatus = async () => {
        if (isWithinTimelineBounds()) {
          if (signalLogs.length === 0) {
            const initialStatus = Math.random() > 0.1 ? "1" : "0";
            if (initialStatus === "0") {
              setNewLogReason(getRandomDowntimeReason());
            }
            setLastStatus(initialStatus);
            console.log("Initial status set:", initialStatus);
          }
        }
      };

      checkInitialStatus();

      simulationInterval = window.setInterval(() => {
        if (isWithinTimelineBounds()) {
          let randomStatus: "0" | "1";
          if (lastStatus === "1") {
            randomStatus = Math.random() < 0.05 ? "0" : "1";
          } else {
            randomStatus = Math.random() < 0.8 ? "1" : "0";
          }

          if (randomStatus !== lastStatus) {
            if (randomStatus === "0") {
              setNewLogReason(getRandomDowntimeReason());
            }
            setLastStatus(randomStatus);
            console.log("Status changed to:", randomStatus);
          }
        }
      }, Math.floor(Math.random() * 15000) + 30000);
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
    if (!selectedMachine) return false;

    const success = await updateSignalLogReason(logId, reason, selectedMachine);
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
    lastStatus,
    timeRange: { startTime, endTime }
  };
}