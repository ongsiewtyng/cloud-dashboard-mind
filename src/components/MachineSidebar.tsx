
import { ScrollArea } from "@/components/ui/scroll-area";

interface MachineSidebarProps {
  machines: Array<{
    id: string;
    latestData?: {
      signalON: string;
      machineNumber: string;
      serialNumber: string;
    };
  }>;
  selectedMachine: string | null;
  onMachineClick: (machineId: string) => void;
}

export function MachineSidebar({ machines, selectedMachine, onMachineClick }: MachineSidebarProps) {
  return (
    <div className="w-64 mr-6 border-r pr-4">
      <h2 className="text-xl font-semibold mb-4">Machines</h2>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-2">
          {machines.map((machine) => (
            <div 
              key={machine.id}
              onClick={() => onMachineClick(machine.id)}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedMachine === machine.id 
                  ? "bg-primary/10 border-l-4 border-primary" 
                  : "hover:bg-secondary"
              }`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  machine.latestData?.signalON === "1" ? "bg-green-500" : "bg-red-500"
                }`} />
                <div>
                  <div className="font-medium">Machine {machine.latestData?.machineNumber || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">
                    S/N: {machine.latestData?.serialNumber || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
