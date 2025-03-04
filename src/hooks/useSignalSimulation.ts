
import { useState, useEffect } from "react";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  reason: string;
}

export function useSignalSimulation(selectedMachine: string | null) {
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1");

  // Automatically start simulation when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
    }
  }, [selectedMachine]);

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

    return true;
  };

  // Simulation logic
  useEffect(() => {
    let simulationInterval: number | null = null;
    
    if (isSimulating && selectedMachine) {
      console.log("Starting automated simulation for machine:", selectedMachine);
      
      // Initial random status - start with "running" most of the time for better UX
      const initialStatus = Math.random() > 0.2 ? "1" : "0";
      
      // If initial status is downtime, generate random reason
      if (initialStatus === "0") {
        const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
        addSignalLog(selectedMachine, initialStatus, randomReason);
      } else {
        addSignalLog(selectedMachine, initialStatus);
      }
      
      // Distribute logs across the workday timeline for more realistic visualization
      const generateRandomTime = () => {
        // Generate time between 8:00 and 17:00
        const hour = Math.floor(Math.random() * 9) + 8; // 8-17
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      };
      
      // Generate some historical data for better timeline visualization
      const generateHistoricalData = () => {
        const statuses: ("0" | "1")[] = ["0", "1"];
        const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
        
        // Generate 5-10 historical records
        const numRecords = Math.floor(Math.random() * 6) + 5;
        
        for (let i = 0; i < numRecords; i++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const reason = status === "0" ? reasons[Math.floor(Math.random() * reasons.length)] : "";
          
          const historicalLog = {
            id: `hist-${Date.now()}-${i}`,
            machineId: selectedMachine,
            status,
            timestamp: generateRandomTime(),
            reason,
          };
          
          setSignalLogs(prev => [historicalLog, ...prev]);
        }
      };
      
      // Generate historical data once on initial load
      if (signalLogs.filter(log => log.machineId === selectedMachine).length === 0) {
        generateHistoricalData();
      }
      
      simulationInterval = window.setInterval(() => {
        // For more balanced on/off simulation, use the lastStatus to determine next status
        // If last was running (1), 40% chance of stopping (0)
        // If last was stopped (0), 60% chance of starting (1)
        let randomStatus: "0" | "1";
        
        if (lastStatus === "1") {
          // If was running, 40% chance to stop
          randomStatus = Math.random() < 0.4 ? "0" : "1";
        } else {
          // If was stopped, 60% chance to start
          randomStatus = Math.random() < 0.6 ? "1" : "0";
        }
        
        // Generate random reason for downtime
        if (randomStatus === "0") {
          const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
          const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
          addSignalLog(selectedMachine, randomStatus, randomReason);
        } else {
          addSignalLog(selectedMachine, randomStatus);
        }
      }, Math.floor(Math.random() * 5000) + 5000); // Random interval between 5-10 seconds
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
