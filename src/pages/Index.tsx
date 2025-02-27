
import { useEffect } from "react";
import { MachineList } from "@/components/MachineList";
import { AddMachineDialog } from "@/components/AddMachineDialog";
import { ImportDataDialog } from "@/components/ImportDataDialog";
import { UsageChart } from "@/components/UsageChart";
import { useMachineStore } from "@/lib/machine-service";

const Index = () => {
    const { machines, addMachine, deleteMachine, updateMachineStats, fetchMachines } = useMachineStore();

    useEffect(() => {
        fetchMachines();
        const interval = setInterval(() => {
            updateMachineStats();
        }, 2000);

        return () => clearInterval(interval);
    }, [updateMachineStats, fetchMachines]);

    const handleAddMachine = (machineData: any) => {
        addMachine({
            serial: machineData.serial || '',
            ipAddress: machineData.ipAddress || '',
            machineNumber: machineData.machineNumber || '',
            signalStatus: 0,
            totalSignals: 0,
            cycleTime: 0,
            productionCount: 0,
            operatingTime: 0,
            downtime: 0,
            timestamp: new Date().toLocaleTimeString(),
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                <div className="flex gap-4">
                    <ImportDataDialog />
                    <AddMachineDialog onAdd={handleAddMachine} />
                </div>
            </div>

            <div className="slide-in">
                <UsageChart machines={machines} />
            </div>

            <div className="fade-in">
                <MachineList machines={machines} onDelete={deleteMachine} />
            </div>
        </div>
    );
};

export default Index;
