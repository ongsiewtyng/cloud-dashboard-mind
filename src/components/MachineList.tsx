
import { MachineRecord, MachineLatestData } from "@/lib/machine-service"
import { Server, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MachineListProps {
  machines: MachineRecord[]
  onDelete: (id: string) => void
}

export function MachineList({ machines, onDelete }: MachineListProps) {
  if (!machines || machines.length === 0) {
    return <p className="text-gray-500">No machines available</p>;
  }

  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {machines.map((machine) => (
          <div key={machine.id} className="widget group relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                  onClick={() => onDelete(machine.id)}
                  className="rounded-full p-2 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className={cn(
                    "rounded-full p-2",
                    (machine.dataHistory?.latestData?.signalON === "1") ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                )}>
                  <Server className="h-5 w-5" />
                </div>
                <div className={cn(
                    "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white",
                    (machine.dataHistory?.latestData?.signalON === "1") ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-medium">{machine.dataHistory?.latestData?.machineNumber || 'Unknown'}</h3>
                <div className="text-sm text-muted-foreground">
                  Serial: {machine.dataHistory?.latestData?.serialNumber || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  IP: {machine.dataHistory?.latestData?.ipAddress || 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Cycle Time</span>
                  <span>{parseFloat(machine.dataHistory?.latestData?.cycleTime || "0").toFixed(1)}s</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                      className={cn(
                          "h-full rounded-full bg-green-500",
                          (machine.dataHistory?.latestData?.signalON === "1") ? "transition-all duration-500" : ""
                      )}
                      style={{ width: `${Math.min((parseFloat(machine.dataHistory?.latestData?.cycleTime || "0") / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Production Count</span>
                  <span>{machine.dataHistory?.latestData?.productionResults || "0"}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                      className={cn(
                          "h-full rounded-full bg-blue-500",
                          (machine.dataHistory?.latestData?.signalON === "1") ? "transition-all duration-500" : ""
                      )}
                      style={{ width: `${Math.min((parseInt(machine.dataHistory?.latestData?.productionResults || "0", 10) / 400) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
  )
}
