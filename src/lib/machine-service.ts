import {create} from 'zustand'
import {db} from "@/lib/firebase";
import {ref, push, remove, update} from "firebase/database";

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
    addMachine: (machine) => {
        const newMachineRef = push(ref(db, "machines"));
        console.log(newMachineRef.key);
        const newMachine = {id: newMachineRef.key, ...machine};

        set((state) => ({
            machines: [...state.machines, newMachine],
        }));

        // Save to Firebase
        if (newMachineRef.key) {
          update(ref(db, `machines/${newMachineRef.key}`), newMachine).catch((error: Error) => {
            console.error("Error adding machine:", error);
          });
        }
    },
    deleteMachine: (id) => {
        set((state) => ({
            machines: state.machines.filter((m) => m.id !== id),
        }));

        // Remove from Firebase
        remove(ref(db, `machines/${id}`)).catch((error) => {
            console.error("Error deleting machine:", error);
        });
    },
    renameMachine: (id, newName) => {
        set((state) => ({
            machines: state.machines.map((m) =>
                m.id === id ? {...m, name: newName} : m
            ),
        }));

        // Update name in Firebase
        update(ref(db, `machines/${id}`), {name: newName}).catch((error) => {
            console.error("Error renaming machine:", error);
        });
    },
    updateMachineStats: () => {
        set((state) => {
            const updatedMachines = state.machines.map((machine) => {
                const newStatus =
                    Math.random() > 0.95
                        ? machine.status === "online"
                            ? "offline"
                            : "online"
                        : machine.status;

                const updatedMachine =
                    newStatus === "online"
                        ? {
                            ...machine,
                            status: newStatus,
                            cpuUsage: Math.min(
                                100,
                                Math.max(0, machine.cpuUsage + (Math.random() - 0.5) * 10)
                            ),
                            memoryUsage: Math.min(
                                100,
                                Math.max(0, machine.memoryUsage + (Math.random() - 0.5) * 5)
                            ),
                        }
                        : {
                            ...machine,
                            status: newStatus,
                        };

                // Update in Firebase
                update(ref(db, `machines/${machine.id}`), updatedMachine).catch(
                    (error) => {
                        console.error("Error updating machine:", error);
                    }
                );

                return updatedMachine;
            });

            return {machines: updatedMachines};
        });
    },
}))
