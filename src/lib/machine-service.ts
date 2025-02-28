
import {create} from 'zustand'
import {db} from "@/lib/firebase";
import {ref, push, remove, update, get} from "firebase/database";

export interface MachineLatestData {
    cycleTime: string;
    downtime: string;
    ipAddress: string;
    machineNumber: string;
    operatingTime: string;
    productionResults: string;
    serialNumber: string;
    signalON: string;
    timestamp: string;
    totalSignal: string;
}

export interface MachineRecord {
    id: string;
    dataHistory: {
        latestData: MachineLatestData;
    };
    latestTimestamp: string;
}

interface MachineStore {
    machines: MachineRecord[];
    addMachine: (machine: Omit<MachineRecord, 'id'>) => void;
    deleteMachine: (id: string) => void;
    updateMachineStats: () => void;
    fetchMachines: () => void;
}

export const useMachineStore = create<MachineStore>((set) => ({
    machines: [],
    addMachine: (machine) => {
        const newMachineRef = push(ref(db, "machines"));
        const newMachine = {id: newMachineRef.key, ...machine};

        set((state) => ({
            machines: [...state.machines, newMachine],
        }));

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

        remove(ref(db, `machines/${id}`)).catch((error) => {
            console.error("Error deleting machine:", error);
        });
    },
    updateMachineStats: () => {
        // This function might not be needed anymore since we're getting real data
        console.log("Machine stats update skipped - using real data");
    },
    fetchMachines: () => {
        get(ref(db, "machines")).then((snapshot) => {
            if (snapshot.exists()) {
                const machinesData = snapshot.val();
                const machines = Object.keys(machinesData).map((key) => ({
                    id: key,
                    ...machinesData[key],
                }));
                set({ machines });
                console.log("Fetched machines:", machines);
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error("Error fetching machines:", error);
        });
    },
}));
