
import { useState, useEffect } from "react";
import { useMachineStore } from "@/lib/machine-service";
import { MachineSidebar } from "@/components/MachineSidebar";
import { MachineDetails } from "@/components/MachineDetails";
import { SignalHistory } from "@/components/SignalHistory";
import { MachineSelectPlaceholder } from "@/components/MachineSelectPlaceholder";
import { toast } from "sonner";

const MachineConditions = () => {
  const { machines, deleteMachine } = useMachineStore();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [signalLogs, setSignalLogs] = useState<Array<{
    id: string;
    machineId: string;
    status: "0" | "1";
    timestamp: string;
    reason: string;
  }>>([]);
  const [newLogReason, setNewLogReason] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastStatus, setLastStatus] = useState<"0" | "1">("1"); // Track last status to ensure alternating

  // Debugging
  useEffect(() => {
    console.log("Selected machine:", selectedMachine);
    console.log("Available machines:", machines);
  }, [selectedMachine, machines]);

  // Automatically start simulation when a machine is selected
  useEffect(() => {
    if (selectedMachine) {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
    }
  }, [selectedMachine]);

  const handleMachineClick = (machineId: string) => {
    console.log("Machine clicked:", machineId);
    setSelectedMachine(machineId);
  };

  const handleClosePanel = () => {
    setSelectedMachine(null);
  };

  const addSignalLog = (machineId: string, status: "0" | "1", autoReason?: string) => {
    // For automatic logging, use provided reason or generate one for downtime
    let reason = status === "1" ? "Start" : newLogReason;
    
    // If auto reason is provided (from simulation), use it
    if (autoReason && status === "0") {
      reason = autoReason;
    }
    
    const newLog = {
      id: Date.now().toString(),
      machineId,
      status,
      timestamp: new Date().toLocaleTimeString(),
      reason,
    };

    setSignalLogs([newLog, ...signalLogs]);
    setNewLogReason("");
    setLastStatus(status); // Update last status
    
    // Only show toast for manual logs, not auto-generated ones
    if (!autoReason) {
      toast.success(`Machine status ${status === "1" ? "running" : "downtime"} recorded successfully`);
    }
  };

  const updateLogReason = (logId: string, newReason: string) => {
    const updatedLogs = signalLogs.map(log => {
      if (log.id === logId) {
        return { ...log, reason: newReason };
      }
      return log;
    });
    
    setSignalLogs(updatedLogs);
    toast.success("Downtime reason updated successfully");
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
  }, [isSimulating, selectedMachine, lastStatus]); // Add lastStatus as dependency

  const selectedMachineData = machines.find(m => m.id === selectedMachine);
  const currentStatus = signalLogs.length > 0 && signalLogs[0].machineId === selectedMachine 
    ? signalLogs[0].status 
    : "1"; // Default to running if no logs yet

  return (
    <div className="container mx-auto p-6 flex h-[calc(100vh-4rem)]">
      <MachineSidebar 
        machines={machines}
        selectedMachine={selectedMachine}
        onMachineClick={handleMachineClick}
      />

      <div className="flex-1">
        {selectedMachine ? (
          <div className="space-y-6">
            <MachineDetails 
              machineData={selectedMachineData} 
              onClose={handleClosePanel} 
            />
            
            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-2">
              <span className="font-medium">Automatic Simulation Active:</span> Machine status is being simulated in real-time with both running and stopped states. Data updates every 5-10 seconds.
            </div>
            
            <SignalHistory 
              machineId={selectedMachine}
              signalLogs={signalLogs}
              currentStatus={currentStatus}
              onAddLog={addSignalLog}
              newLogReason={newLogReason}
              setNewLogReason={setNewLogReason}
            />
          </div>
        ) : (
          <MachineSelectPlaceholder />
        )}
      </div>
    </div>
  );
};

export default MachineConditions;
