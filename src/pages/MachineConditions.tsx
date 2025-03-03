
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

  const addSignalLog = (machineId: string, status: "0" | "1") => {
    if (!newLogReason && status === "0") return;
    
    const newLog = {
      id: Date.now().toString(),
      machineId,
      status,
      timestamp: new Date().toLocaleTimeString(),
      reason: status === "1" ? "Start" : newLogReason,
    };

    setSignalLogs([newLog, ...signalLogs]);
    setNewLogReason("");
    toast.success(`Machine status ${status === "1" ? "running" : "downtime"} recorded successfully`);
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
      
      if (initialStatus === "0") {
        const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
        setNewLogReason(reasons[Math.floor(Math.random() * reasons.length)]);
      }
      
      addSignalLog(selectedMachine, initialStatus as "0" | "1");
      
      simulationInterval = window.setInterval(() => {
        // Random status change every 5-15 seconds
        // Make it 70% likely to be running for a more realistic simulation
        const randomStatus = Math.random() > 0.3 ? "1" : "0";
        
        // If status is 0 (downtime), select a random reason
        if (randomStatus === "0") {
          const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
          const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
          setNewLogReason(randomReason);
        }
        
        // Add the log
        addSignalLog(selectedMachine, randomStatus as "0" | "1");
      }, Math.floor(Math.random() * 5000) + 5000); // Random interval between 5-10 seconds
    }
    
    return () => {
      if (simulationInterval) {
        console.log("Stopping simulation");
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, selectedMachine]);

  const selectedMachineData = machines.find(m => m.id === selectedMachine);
  const currentStatus = selectedMachineData?.latestData?.signalON as "0" | "1" || "0";

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
              <span className="font-medium">Automatic Simulation Active:</span> Machine status is being simulated in real-time. Data updates every 5-10 seconds.
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
