
import { useEffect } from "react";
import { MachineList } from "@/components/MachineList";
import { AddMachineDialog } from "@/components/AddMachineDialog";
import { ImportDataDialog } from "@/components/ImportDataDialog";
import { UsageChart } from "@/components/UsageChart";
import { useMachineStore } from "@/lib/machine-service";

const Index = () => {
    const { machines, addMachine, deleteMachine, updateMachineStats, fetchMachines } = useMachineStore();

    useEffect(() => {
        const hasInitialized = localStorage.getItem('hasInitializedMachines');
        
        // Add example machines only if they haven't been initialized before
        if (!hasInitialized && machines.length === 0) {
            const exampleMachines = [
                {
                    serial: "MC-001",
                    ipAddress: "192.168.1.101",
                    machineNumber: "M1",
                    signalStatus: 1,
                    totalSignals: 150,
                    cycleTime: 45.5,
                    productionCount: 75,
                    operatingTime: 3600,
                    downtime: 120,
                    timestamp: new Date().toLocaleTimeString(),
                },
                {
                    serial: "MC-002",
                    ipAddress: "192.168.1.102",
                    machineNumber: "M2",
                    signalStatus: 0,
                    totalSignals: 100,
                    cycleTime: 38.2,
                    productionCount: 50,
                    operatingTime: 2400,
                    downtime: 300,
                    timestamp: new Date().toLocaleTimeString(),
                },
                {
                    serial: "MC-003",
                    ipAddress: "192.168.1.103",
                    machineNumber: "M3",
                    signalStatus: 1,
                    totalSignals: 200,
                    cycleTime: 52.8,
                    productionCount: 90,
                    operatingTime: 4800,
                    downtime: 60,
                    timestamp: new Date().toLocaleTimeString(),
                }
            ];

            exampleMachines.forEach(machine => addMachine(machine));
            localStorage.setItem('hasInitializedMachines', 'true');
        }

        fetchMachines();
        const interval = setInterval(() => {
            updateMachineStats();
        }, 2000);

        return () => clearInterval(interval);
    }, [updateMachineStats, fetchMachines, addMachine, machines.length]);

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
