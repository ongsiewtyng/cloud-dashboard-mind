
import { Machine } from "@/lib/machine-service"
import { Server, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MachineListProps {
  machines: Machine[]
  onDelete: (id: string) => void
}

export function MachineList({ machines, onDelete }: MachineListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {machines.map((machine) => (
        <div
          key={machine.id}
          className="widget group relative overflow-hidden"
        >
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onDelete(machine.id)}
              className="rounded-full p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-start space-x-4">
            <div
              className={cn(
                "rounded-full p-2",
                machine.status === "online"
                  ? "bg-green-50 text-green-500"
                  : machine.status === "maintenance"
                  ? "bg-yellow-50 text-yellow-500"
                  : "bg-red-50 text-red-500"
              )}
            >
              <Server className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{machine.name}</h3>
              <div className="text-sm text-muted-foreground">
                CPU: {machine.cpuUsage.toFixed(1)}% | Memory:{" "}
                {machine.memoryUsage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Uptime: {machine.uptimeHours}h
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>CPU Usage</span>
                <span>{machine.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${machine.cpuUsage}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Memory Usage</span>
                <span>{machine.memoryUsage.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${machine.memoryUsage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
