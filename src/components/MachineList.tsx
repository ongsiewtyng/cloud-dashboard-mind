import { MachineRecord, MachineLatestData } from "@/lib/machine-service"
import { Server, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MachineListProps {
  machinesNo: MachineRecord[]
  machines: MachineLatestData[]
  onDelete: (id: string) => void
}

export function MachineList({ machines,machinesNo, onDelete }: MachineListProps) {
  if (!machinesNo) {
    console.log("machinesNo is undefined or null");
    return <p className="text-gray-500">No machines available</p>;
  }

  if (Array.isArray(machinesNo)) {
    console.log("machinesNo is an array, not an object");
    return <p className="text-gray-500">Invalid data format</p>;
  }

  if (Object.keys(machinesNo).length === 0) {
    console.log("machinesNo is an empty object");
    return <p className="text-gray-500">No machines available</p>;
  }

  return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(machinesNo).map(([serial, value]) => {
          const data = machines.find((m) => m.serialNumber === serial);
          return (
              <div key={serial} className="widget group relative overflow-hidden">
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                      onClick={() => onDelete(serial)}
                      className="rounded-full p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <div className={cn(
                        "rounded-full p-2",
                        (data.signalON ?? 0) === 1 ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
                    )}>
                      <Server className="h-5 w-5" />
                    </div>
                    <div className={cn(
                        "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white",
                        (data.signalON ?? 0) === 1 ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">{data.machineNumber || 'Unknown'}</h3>
                    <div className="text-sm text-muted-foreground">
                      Serial: {data.serialNumber || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      IP: {data.ipAddress || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Cycle Time</span>
                      <span>{(data.cycleTime ?? 0).toFixed(1)}s</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                          className={cn(
                              "h-full rounded-full bg-green-500",
                              (data.signalON ?? 0) === 1 ? "transition-all duration-500" : ""
                          )}
                          style={{ width: `${((data.cycleTime ?? 0) / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Production Count</span>
                      <span>{data.productionResults ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                          className={cn(
                              "h-full rounded-full bg-blue-500",
                              (data.signalON ?? 0) === 1 ? "transition-all duration-500" : ""
                          )}
                          style={{ width: `${((data.productionResults ?? 0) / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
          )
        })}
      </div>
  )
}
