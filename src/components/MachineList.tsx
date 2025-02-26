
import { Machine, useMachineStore } from "@/lib/machine-service"
import { Server, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Input } from "./ui/input"

interface MachineListProps {
  machines: Machine[]
  onDelete: (id: string) => void
}

export function MachineList({ machines, onDelete }: MachineListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const renameMachine = useMachineStore((state) => state.renameMachine)
  
  const handleEdit = (machine: Machine) => {
    setEditingId(machine.id)
    setEditingName(machine.name)
  }

  const handleSave = (id: string) => {
    if (editingName.trim()) {
      renameMachine(id, editingName.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {machines.map((machine) => (
        <div
          key={machine.id}
          className="widget group relative overflow-hidden"
        >
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 flex gap-2">
            <button
              onClick={() => handleEdit(machine)}
              className="rounded-full p-2 text-blue-500 hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(machine.id)}
              className="rounded-full p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-start space-x-4">
            <div className="relative">
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
              <div
                className={cn(
                  "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white",
                  machine.status === "online"
                    ? "bg-green-500 animate-pulse"
                    : machine.status === "maintenance"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              />
            </div>
            <div className="space-y-1 flex-1">
              {editingId === machine.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave(machine.id)}
                    className="h-7 py-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(machine.id)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h3 className="font-medium">{machine.name}</h3>
              )}
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
