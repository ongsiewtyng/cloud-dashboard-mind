
import { create } from 'zustand'

export interface Machine {
  id: string
  name: string
  status: 'online' | 'offline' | 'maintenance'
  cpuUsage: number
  memoryUsage: number
  uptimeHours: number
}

interface MachineStore {
  machines: Machine[]
  addMachine: (machine: Omit<Machine, 'id'>) => void
  deleteMachine: (id: string) => void
  updateMachineStats: () => void
  renameMachine: (id: string, newName: string) => void
}

export const useMachineStore = create<MachineStore>((set) => ({
  machines: [
    {
      id: '1',
      name: 'Production Server 1',
      status: 'online',
      cpuUsage: 45,
      memoryUsage: 62,
      uptimeHours: 124,
    },
    {
      id: '2',
      name: 'Development Server',
      status: 'online',
      cpuUsage: 28,
      memoryUsage: 45,
      uptimeHours: 72,
    },
  ],
  addMachine: (machine) =>
    set((state) => ({
      machines: [
        ...state.machines,
        {
          ...machine,
          id: Math.random().toString(36).substr(2, 9),
        },
      ],
    })),
  deleteMachine: (id) =>
    set((state) => ({
      machines: state.machines.filter((m) => m.id !== id),
    })),
  renameMachine: (id, newName) =>
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === id ? { ...m, name: newName } : m
      ),
    })),
  updateMachineStats: () =>
    set((state) => ({
      machines: state.machines.map((machine) => ({
        ...machine,
        cpuUsage: Math.min(100, Math.max(0, machine.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(0, machine.memoryUsage + (Math.random() - 0.5) * 5)),
        status: Math.random() > 0.95 ? (machine.status === 'online' ? 'offline' : 'online') : machine.status,
      })),
    })),
}))
