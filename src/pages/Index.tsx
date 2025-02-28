
import { useEffect } from "react";
import { AddMachineDialog } from "@/components/AddMachineDialog";
import { ImportDataDialog } from "@/components/ImportDataDialog";
import { UsageChart } from "@/components/UsageChart";
import { useMachineStore } from "@/lib/machine-service";

const Index = () => {
    const { machines, addMachine, updateMachineStats, fetchMachines } = useMachineStore();

    useEffect(() => {
        fetchMachines();
        const interval = setInterval(() => {
            updateMachineStats();
        }, 2000);

        return () => clearInterval(interval);
    }, [updateMachineStats, fetchMachines]);

    const handleAddMachine = (machineData: any) => {
        const getRandomValue = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        addMachine({
            serial: machineData.serial || `SN-${getRandomValue(1000, 9999)}`,
            ipAddress: machineData.ipAddress || `192.168.${getRandomValue(0, 255)}.${getRandomValue(0, 255)}`,
            machineNumber: machineData.machineNumber || `M-${getRandomValue(1, 100)}`,
            signalStatus: getRandomValue(0, 1),  // 0 (inactive) or 1 (active)
            totalSignals: getRandomValue(50, 500),
            cycleTime: getRandomValue(10, 100), // Random cycle time in seconds
            productionCount: getRandomValue(5, 50),
            operatingTime: getRandomValue(1, 24), // Hours
            downtime: getRandomValue(0, 5), // Random downtime in hours
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
        </div>
    );
};

export default Index;
