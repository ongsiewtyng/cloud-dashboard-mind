
import { useMachineStore } from "@/lib/machine-service";
import { MachineList } from "@/components/MachineList";

const MachineConditions = () => {
  const { machines, deleteMachine } = useMachineStore();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Machine Conditions</h1>
      
      <div className="fade-in">
        <MachineList machines={machines} onDelete={deleteMachine} />
      </div>
    </div>
  );
};

export default MachineConditions;
