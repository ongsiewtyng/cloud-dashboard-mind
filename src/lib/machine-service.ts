import { create } from "zustand";
import { db } from "@/lib/firebase";
import { ref, push, remove, update, onValue } from "firebase/database";

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
    dataHistory: any; // This contains timestamp data
    latestData: MachineLatestData;
    latestTimestamp: string;
}

interface MachineStore {
    machines: MachineRecord[];
    addMachine: (machine: Omit<MachineRecord, "id">) => void;
    deleteMachine: (id: string) => void;
}

export const useMachineStore = create<MachineStore>((set) => {
    const machinesRef = ref(db, "machines");

    // ✅ Subscribe to Firebase real-time updates
    onValue(machinesRef, (snapshot) => {
        if (snapshot.exists()) {
            const machinesData = snapshot.val();
            const machines = Object.keys(machinesData).map((key) => ({
                id: key,
                ...machinesData[key],
            }));
            set({ machines }); // Update Zustand state
            console.log("Real-time machines updated:", machines);
        } else {
            set({ machines: [] }); // No machines available
            console.log("No machines found");
        }
    });

    return {
        machines: [],
        addMachine: (machine) => {
            const newMachineRef = push(machinesRef);
            const newMachine = { id: newMachineRef.key, ...machine };

            if (newMachineRef.key) {
                update(ref(db, `machines/${newMachineRef.key}`), newMachine).catch(
                    (error: Error) => {
                        console.error("Error adding machine:", error);
                    }
                );
            }
        },
        deleteMachine: (id) => {
            remove(ref(db, `machines/${id}`)).catch((error) => {
                console.error("Error deleting machine:", error);
            });
        },
    };
});
