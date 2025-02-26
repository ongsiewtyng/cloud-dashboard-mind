
import { useEffect } from "react"
import { MachineList } from "@/components/MachineList"
import { AddMachineDialog } from "@/components/AddMachineDialog"
import { UsageChart } from "@/components/UsageChart"
import { useMachineStore } from "@/lib/machine-service"

const Index = () => {
  const { machines, addMachine, deleteMachine, updateMachineStats } = useMachineStore()

  useEffect(() => {
    const interval = setInterval(() => {
      updateMachineStats()
    }, 2000)

    return () => clearInterval(interval)
  }, [updateMachineStats])

  const handleAddMachine = (name: string) => {
    addMachine({
      name,
      status: "online",
      cpuUsage: Math.random() * 50,
      memoryUsage: Math.random() * 50,
      uptimeHours: 0,
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <AddMachineDialog onAdd={handleAddMachine} />
      </div>
      
      <div className="slide-in">
        <UsageChart machines={machines} />
      </div>

      <div className="fade-in">
        <MachineList machines={machines} onDelete={deleteMachine} />
      </div>
    </div>
  )
}

export default Index
