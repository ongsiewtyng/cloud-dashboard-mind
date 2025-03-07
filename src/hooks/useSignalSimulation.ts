import { useState, useEffect } from "react";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
  reason: string;
}

export function useSignalSimulation(selectedMachine: string | null) {
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1");
  const [lastLogTime, setLastLogTime] = useState<Date | null>(null);

  // Automatically start simulation when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
    }
  }, [selectedMachine]);

  // Helper function to calculate time difference
  const getTimeDifference = (start: string, end: string): string => {
    const startDate = new Date(`1970-01-01T${start}Z`);
    const endDate = new Date(`1970-01-01T${end}Z`);
    
    // If end time is before start time, assume it's the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    } else {
      return `${remainingMins}m`;
    }
  };

  const addSignalLog = (machineId: string, status: "0" | "1", autoReason?: string) => {
    let reason = status === "1" ? "" : newLogReason;

    if (autoReason && status === "0") {
      reason = autoReason;
    }

    // Format timestamp in HH:MM:SS format
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timestamp = `${hours}:${minutes}:${seconds}`;

    // Find the previous log (if any) to calculate duration
    const previousLogs = signalLogs.filter(log => log.machineId === machineId);
    const previousLog = previousLogs.length > 0 ? previousLogs[0] : null;
    
    let endTimestamp: string | undefined;
    let duration: string | undefined;
    
    // If there was a previous log, update it with end time and duration
    if (previousLog && previousLog.status !== status) {
      endTimestamp = timestamp;
      duration = getTimeDifference(previousLog.timestamp, timestamp);
      
      // Update the previous log with end time and duration
      setSignalLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === previousLog.id 
            ? { ...log, endTimestamp, duration } 
            : log
        )
      );
    }

    const newLog = {
      id: Date.now().toString(),
      machineId,
      status,
      timestamp,
      reason,
    };

    // Check for duplication or conflicting logs at the same timestamp
    if (signalLogs.length > 0) {
      const lastLog = signalLogs[0];

      const lastLogTime = new Date(`1970-01-01T${lastLog.timestamp}Z`).getTime();
      const newLogTime = new Date(`1970-01-01T${newLog.timestamp}Z`).getTime();

      if (
          lastLog.machineId === newLog.machineId &&
          Math.abs(newLogTime - lastLogTime) < 1000 // Within 1 sec
      ) {
        if (
            lastLog.status === newLog.status &&
            lastLog.reason === newLog.reason
        ) {
          console.log("Duplicate log detected, not adding to signalLogs");
          return;
        }

        if (lastLog.status !== newLog.status) {
          console.log("Conflicting log detected at same timestamp, not adding");
          return;
        }
      }
    }

    setSignalLogs(prevLogs => [newLog, ...prevLogs]);
    setNewLogReason("");
    setLastStatus(status);
    setLastLogTime(now);

    return true;
  };

  // Simulation logic with more realistic patterns and longer running periods
  useEffect(() => {
    let simulationInterval: number | null = null;
    
    if (isSimulating && selectedMachine) {
      console.log("Starting automated simulation for machine:", selectedMachine);
      
      // Initial random status - start with "running" most of the time for better UX
      const initialStatus = Math.random() > 0.1 ? "1" : "0"; // 90% chance to start running
      
      // If initial status is downtime, generate random reason
      if (initialStatus === "0") {
        const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
        addSignalLog(selectedMachine, initialStatus, randomReason);
      } else {
        addSignalLog(selectedMachine, initialStatus);
      }
      
      // Generate historical data with more realistic running/stopping patterns
      const generateHistoricalData = () => {
        const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
        let currentStatus: "0" | "1" = "1"; // Start with running
        let currentTime = new Date();
        currentTime.setHours(8, 0, 0); // Start at 8:00 AM
        
        const endWorkday = new Date();
        endWorkday.setHours(17, 0, 0); // End at 5:00 PM
        
        const logs: SignalLog[] = [];
        
        while (currentTime < endWorkday) {
          // Record current status
          const hours = currentTime.getHours().toString().padStart(2, '0');
          const minutes = currentTime.getMinutes().toString().padStart(2, '0');
          const seconds = currentTime.getSeconds().toString().padStart(2, '0');
          const timestamp = `${hours}:${minutes}:${seconds}`;
          
          // Add log for current status
          const log: SignalLog = {
            id: `hist-${Date.now()}-${logs.length}`,
            machineId: selectedMachine,
            status: currentStatus,
            timestamp,
            reason: currentStatus === "0" ? reasons[Math.floor(Math.random() * reasons.length)] : ""
          };
          
          logs.push(log);
          
          // Determine duration before next status change with longer running periods
          let minutesToAdd: number;
          
          if (currentStatus === "1") {
            // Running periods are much longer (1-5 hours)
            minutesToAdd = Math.floor(Math.random() * 240) + 60; // 1-5 hours
          } else {
            // Downtime periods are shorter (5-30 min)
            minutesToAdd = Math.floor(Math.random() * 25) + 5; // 5-30 minutes
          }
          
          // Add duration to current time for next status
          currentTime = new Date(currentTime.getTime() + minutesToAdd * 60000);
          
          // Add end timestamp and duration to previous log
          if (logs.length > 0) {
            const prevLog = logs[logs.length - 1];
            const newHours = currentTime.getHours().toString().padStart(2, '0');
            const newMinutes = currentTime.getMinutes().toString().padStart(2, '0');
            const newSeconds = currentTime.getSeconds().toString().padStart(2, '0');
            const endTimestamp = `${newHours}:${newMinutes}:${newSeconds}`;
            
            prevLog.endTimestamp = endTimestamp;
            prevLog.duration = getTimeDifference(prevLog.timestamp, endTimestamp);
          }
          
          // Toggle status for next iteration
          currentStatus = currentStatus === "1" ? "0" : "1";
        }
        
        // Add logs in reverse order (newest first)
        for (const log of logs.reverse()) {
          setSignalLogs(prev => [log, ...prev]);
        }
      };
      
      // Generate historical data once on initial load
      if (signalLogs.filter(log => log.machineId === selectedMachine).length === 0) {
        generateHistoricalData();
      }
      
      simulationInterval = window.setInterval(() => {
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
            const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
            const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
            addSignalLog(selectedMachine, randomStatus, randomReason);
          } else {
            addSignalLog(selectedMachine, randomStatus);
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
  }, [isSimulating, selectedMachine, lastStatus]);

  return {
    signalLogs,
    newLogReason,
    setNewLogReason,
    addSignalLog,
    lastStatus
  };
}
