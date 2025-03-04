
import { useState, useEffect } from "react";
import { useMachineStore } from "@/lib/machine-service";

export function useMachineSelection() {
  const { machines } = useMachineStore();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

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

  return {
    machines,
    selectedMachine,
    handleMachineClick,
    handleClosePanel,
  };
}
