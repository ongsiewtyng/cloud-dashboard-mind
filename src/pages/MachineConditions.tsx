
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

  // Debugging
  useEffect(() => {
    console.log("Selected machine:", selectedMachine);
    console.log("Available machines:", machines);
  }, [selectedMachine, machines]);

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
