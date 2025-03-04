
import { useState, useEffect } from "react";
import { useMachineStore } from "@/lib/machine-service";
import { MachineSidebar } from "@/components/MachineSidebar";
import { MachineDetails } from "@/components/MachineDetails";
import { SignalHistory } from "@/components/SignalHistory";
import { MachineSelectPlaceholder } from "@/components/MachineSelectPlaceholder";
import { toast } from "sonner";
import { useMachineSelection } from "@/hooks/useMachineSelection";
import { useSignalSimulation } from "@/hooks/useSignalSimulation";

const MachineConditions = () => {
  const { machines, selectedMachine, handleMachineClick, handleClosePanel } = useMachineSelection();
  const { 
    signalLogs, 
    newLogReason, 
    setNewLogReason, 
    addSignalLog 
  } = useSignalSimulation(selectedMachine);

  const handleAddLog = (machineId: string, status: "0" | "1") => {
    const added = addSignalLog(machineId, status);
    if (added && status !== "0") {
      toast.success(`Machine status ${status === "1" ? "running" : "downtime"} recorded successfully`);
    }
    return added;
  };

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
              onAddLog={handleAddLog}
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
