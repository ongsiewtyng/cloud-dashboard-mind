import { useState, useEffect, useCallback } from "react";
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
  const [lastSimulationTime, setLastSimulationTime] = useState<number | null>(null);
  const [runningTimeStart, setRunningTimeStart] = useState<number | null>(null);
  const [lastDowntimeStart, setLastDowntimeStart] = useState<number | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number | null>(null);

  // Timeline boundaries (8 AM to 5 PM)
  const startTime = "08:00";
  const endTime = "17:00";

  // Function to add a signal log with proper duration tracking
  const addSignalLogToService = useCallback(async (
    machineId: string, 
    status: "0" | "1", 
    autoReason?: string,
    timestamp?: Date
  ) => {
    if (!machineId) return false;

    const now = timestamp || new Date();
    const logTimestamp = now.toTimeString().substring(0, 8); // HH:MM:SS
    const today = now.toISOString().split('T')[0];

    console.log(`[${logTimestamp}] Attempting to add log - Status: ${status}, Machine: ${machineId}`);

    // Prevent duplicate logs in the same minute
    if (lastLogTime && (now.getTime() - lastLogTime) < 60000) {
      console.log(`[${logTimestamp}] Skipping log - Too soon since last log (${Math.floor((now.getTime() - lastLogTime) / 1000)}s)`);
      return false;
    }

    const reason = status === "1" ? "" : (autoReason || newLogReason);

    // Calculate duration from the last status change
    let duration = "0m";
    if (status === "1" && lastDowntimeStart) {
      const minutes = Math.floor((now.getTime() - lastDowntimeStart) / 60000);
      duration = `${minutes}m`;
      console.log(`[${logTimestamp}] Recovery after ${minutes} minutes of downtime`);
    } else if (status === "0" && runningTimeStart) {
      const minutes = Math.floor((now.getTime() - runningTimeStart) / 60000);
      duration = `${minutes}m`;
      console.log(`[${logTimestamp}] Failure after ${minutes} minutes of running`);
    }

    // Add log to Firebase
    console.log(`[${logTimestamp}] Creating log - Status: ${status}, Duration: ${duration}, Reason: ${reason || 'none'}`);
    const result = await addSignalLog(machineId, status, logTimestamp, reason);

    if (result) {
      console.log(`[${logTimestamp}] Log created successfully`);
      setNewLogReason("");
      setLastStatus(status);
      setLastLogTime(now.getTime());
      
      // Update state based on status
      if (status === "1") {
        setRunningTimeStart(now.getTime());
        setLastDowntimeStart(null);
      } else {
        setLastDowntimeStart(now.getTime());
        setRunningTimeStart(null);
      }

      await updateAllLogDurations(machineId);
      return true;
    }

    console.log(`[${logTimestamp}] Failed to create log`);
    return false;
  }, [newLogReason, lastDowntimeStart, runningTimeStart, lastLogTime]);

  // Function to calculate and update durations in real-time
  const updateDurationsInRealTime = useCallback(() => {
    if (!signalLogs.length) return;

    const now = new Date();
    const updatedLogs = signalLogs.map((log, index) => {
      // Only update the active (last) log if it doesn't have an endTimestamp
      if (index === 0 && !log.endTimestamp) {
        const logTime = new Date(`${log.date}T${log.timestamp}`);
        const durationMinutes = Math.floor((now.getTime() - logTime.getTime()) / 60000);
        return {
          ...log,
          duration: `${durationMinutes}m`
        };
      }
      // Keep existing durations for all other logs
      return log;
    });

    setSignalLogs(updatedLogs);
  }, [signalLogs]);

  // Effect for real-time duration updates
  useEffect(() => {
    if (isSimulating && selectedMachine) {
      // Initial update
      updateDurationsInRealTime();
      // Update durations every minute
      const durationInterval = setInterval(updateDurationsInRealTime, 60000);
      return () => clearInterval(durationInterval);
    }
  }, [isSimulating, selectedMachine, updateDurationsInRealTime]);

  // Check if current time is within timeline boundaries
  const isWithinTimelineBounds = useCallback(() => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const currentTimeMinutes = currentHours * 60 + currentMinutes;
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }, [startTime, endTime]);

  // Initialize simulation when machine is selected
  useEffect(() => {
    if (!selectedMachine) {
      console.log('No machine selected, resetting simulation');
      setSignalLogs([]);
      setIsSimulating(false);
      return;
    }

    let isInitialized = false;
    console.log(`Initializing simulation for machine: ${selectedMachine}`);
    
    const unsubscribe = subscribeToSignalLogs(selectedMachine, async (logs) => {
      // Sort logs by timestamp to ensure proper order
      const sortedLogs = [...logs].sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.timestamp}`).getTime();
        const timeB = new Date(`${b.date}T${b.timestamp}`).getTime();
        return timeB - timeA; // Most recent first
      });

      setSignalLogs(sortedLogs);
      
      if (sortedLogs.length > 0) {
        const mostRecent = sortedLogs[0];
        const timestamp = new Date().toTimeString().substring(0, 8);
        console.log(`[${timestamp}] Loaded ${sortedLogs.length} logs, most recent status: ${mostRecent.status}`);
        
        setLastStatus(mostRecent.status);
        
        // Set appropriate time trackers based on current status
        const mostRecentTime = new Date(`${mostRecent.date}T${mostRecent.timestamp}`);
        if (mostRecent.status === "1") {
          console.log(`[${timestamp}] Initializing running time tracker`);
          setRunningTimeStart(mostRecentTime.getTime());
          setLastDowntimeStart(null);
        } else {
          console.log(`[${timestamp}] Initializing downtime tracker`);
          setLastDowntimeStart(mostRecentTime.getTime());
          setRunningTimeStart(null);
        }
      }

      // Initialize if no logs exist for today
      if (!isInitialized && isWithinTimelineBounds()) {
        isInitialized = true;
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const todayLogs = sortedLogs.filter(log => log.date === today);
        
        if (todayLogs.length === 0) {
          // Generate historical data from 8 AM
          const startOfDay = new Date();
          startOfDay.setHours(8, 0, 0, 0);
          const currentTime = now.getTime();
          
          let currentStatus = "1"; // Start running
          let currentTimestamp = startOfDay.getTime();
          let lastStatusChange = currentTimestamp;

          while (currentTimestamp < currentTime) {
            if (currentStatus === "1") {
              // Running period (30-45 minutes)
              const runDuration = Math.floor(30 + Math.random() * 15) * 60000; // Convert minutes to milliseconds
              currentTimestamp = lastStatusChange + runDuration;
              
              if (currentTimestamp < currentTime) {
                // Create downtime log
                const logTime = new Date(currentTimestamp);
                await addSignalLogToService(selectedMachine, "0", getRandomDowntimeReason(), logTime);
                currentStatus = "0";
                lastStatusChange = currentTimestamp;
              }
            } else {
              // Downtime period (1-5 minutes)
              const downDuration = Math.floor(1 + Math.random() * 4) * 60000; // Convert minutes to milliseconds
              currentTimestamp = lastStatusChange + downDuration;
              
              if (currentTimestamp < currentTime) {
                // Create recovery log
                const logTime = new Date(currentTimestamp);
                await addSignalLogToService(selectedMachine, "1", "", logTime);
                currentStatus = "1";
                lastStatusChange = currentTimestamp;
              }
            }
          }
        }
      }
    });

    setIsSimulating(true);

    return () => {
      console.log("Unsubscribing from signal logs");
      unsubscribe();
    };
  }, [selectedMachine, addSignalLogToService, isWithinTimelineBounds]);

  // Simulation logic for active monitoring
  const runSimulation = useCallback(async (machineId: string, currentStatus: "0" | "1") => {
    const now = new Date();
    const timestamp = now.toTimeString().substring(0, 8);
    
    if (!isWithinTimelineBounds()) {
      console.log(`[${timestamp}] Outside timeline bounds (${startTime}-${endTime})`);
      return;
    }

    if (lastSimulationTime && (now.getTime() - lastSimulationTime) < 60000) {
      console.log(`[${timestamp}] Skipping simulation - Too soon since last check`);
      return;
    }

    console.log(`[${timestamp}] Running simulation check - Current status: ${currentStatus}`);
    let shouldChangeStatus = false;
    let newStatus = currentStatus;

    if (currentStatus === "1") {
      const minutesRunning = runningTimeStart ? Math.floor((now.getTime() - runningTimeStart) / 60000) : 0;
      console.log(`[${timestamp}] Machine has been running for ${minutesRunning} minutes`);
      
      // Check for failure after 30 minutes
      if (minutesRunning >= 30) {
        // Increasing chance of failure between 30-60 minutes
        const minutesOver30 = minutesRunning - 30;
        const failureChance = Math.min(0.95, 0.05 + (minutesOver30 * 0.03)); // 5% base + 3% per minute
        
        const randomValue = Math.random();
        shouldChangeStatus = randomValue < failureChance;
        console.log(`[${timestamp}] Failure check - Chance: ${(failureChance * 100).toFixed(2)}%, Roll: ${(randomValue * 100).toFixed(2)}%, Result: ${shouldChangeStatus ? 'Failed' : 'Survived'}`);
        
        if (shouldChangeStatus) {
          newStatus = "0";
        }
      }
    } else {
      const minutesDown = lastDowntimeStart ? Math.floor((now.getTime() - lastDowntimeStart) / 60000) : 0;
      console.log(`[${timestamp}] Machine has been down for ${minutesDown} minutes`);
      
      // Recovery logic for 1-5 minute downtimes
      if (minutesDown >= 1) {
        let recoveryChance;
        if (minutesDown <= 3) {
          recoveryChance = 0.3; // 30% chance in first 3 minutes
        } else if (minutesDown <= 5) {
          recoveryChance = 0.6; // 60% chance between 3-5 minutes
        } else {
          recoveryChance = 0.9; // 90% chance after 5 minutes
        }
        
        const randomValue = Math.random();
        shouldChangeStatus = randomValue < recoveryChance;
        console.log(`[${timestamp}] Recovery check - Chance: ${(recoveryChance * 100).toFixed(2)}%, Roll: ${(randomValue * 100).toFixed(2)}%, Result: ${shouldChangeStatus ? 'Recovered' : 'Still down'}`);
        
        if (shouldChangeStatus) {
          newStatus = "1";
        }
      }
    }

    if (shouldChangeStatus && newStatus !== currentStatus) {
      console.log(`[${timestamp}] Status changing from ${currentStatus} to ${newStatus}`);
      const reason = newStatus === "0" ? getRandomDowntimeReason() : "";
      await addSignalLogToService(machineId, newStatus, reason);
      setLastSimulationTime(now.getTime());
    }
  }, [lastSimulationTime, runningTimeStart, lastDowntimeStart, addSignalLogToService, startTime, endTime, isWithinTimelineBounds]);

  // Run simulation at regular intervals
  useEffect(() => {
    if (isSimulating && selectedMachine) {
      const simulationInterval = window.setInterval(() => {
        runSimulation(selectedMachine, lastStatus);
      }, 60000); // Check every minute

      return () => clearInterval(simulationInterval);
    }
  }, [isSimulating, selectedMachine, lastStatus, runSimulation]);

  // Update a log's reason
  const updateLogReason = async (logId: string, reason: string) => {
    if (!selectedMachine) return false;
    const success = await updateSignalLogReason(logId, reason, selectedMachine);
    if (success) setNewLogReason("");
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