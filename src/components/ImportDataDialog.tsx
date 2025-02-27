
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download } from "lucide-react";
import Papa from "papaparse";
import * as React from "react";
import { useMachineStore } from "@/lib/machine-service";

export function ImportDataDialog() {
    const [open, setOpen] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);
    const addMachine = useMachineStore((state) => state.addMachine);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target?.result) {
                    const text = e.target.result.toString();
                    const { data } = Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        transform: (value) => {
                            // Convert empty strings to 0 for numeric fields
                            return value === '' ? '0' : value;
                        }
                    });

                    // Process the data to match our MachineRecord interface
                    const processedData = data.map((row: any) => ({
                        serial: row.SERIAL || '',
                        ipAddress: row.IPADDRESS || '',
                        machineNumber: row.M1 || '',
                        signalStatus: Number(row.D1) || 0,
                        totalSignals: Number(row.E1) || 0,
                        cycleTime: Number(row.E3) || 0,
                        productionCount: Number(row.C1) || 0,
                        operatingTime: Number(row.OT) || 0,
                        downtime: Number(row.UT) || 0,
                        timestamp: row.TIMESTAMP || '',
                    }));

                    console.log("Processed Data:", processedData);
                    setCsvData(processedData);
                    setOpen(true);

                    // Save each record to Firebase
                    processedData.forEach((record) => {
                        addMachine(record);
                    });

                    event.target.value = "";
                }
            };

            reader.readAsText(file);
        }
    };

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

    const handleExport = () => {
        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported_data.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Button
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex items-center gap-2 w-full sm:w-auto"
            >
                <Upload className="h-4 w-4" />
                Upload CSV
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="fixed flex flex-col items-center justify-center z-50 w-[95vw] max-w-5xl p-6 rounded-lg bg-white shadow-xl">
                    <div className="w-full">
                        <DialogHeader className="flex justify-between items-center pb-4 border-b">
                            <DialogTitle className="text-lg font-semibold">Imported Data</DialogTitle>
                        </DialogHeader>

                        <div className="overflow-x-auto border rounded-lg max-h-[60vh] mt-4">
                            <table className="w-full border-collapse border border-gray-300 text-sm sm:text-base">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="border border-gray-300 p-3 text-left">Serial</th>
                                        <th className="border border-gray-300 p-3 text-left">IP Address</th>
                                        <th className="border border-gray-300 p-3 text-left">Machine Number</th>
                                        <th className="border border-gray-300 p-3 text-left">Signal Status</th>
                                        <th className="border border-gray-300 p-3 text-left">Total Signals</th>
                                        <th className="border border-gray-300 p-3 text-left">Cycle Time</th>
                                        <th className="border border-gray-300 p-3 text-left">Production Count</th>
                                        <th className="border border-gray-300 p-3 text-left">Operating Time</th>
                                        <th className="border border-gray-300 p-3 text-left">Downtime</th>
                                        <th className="border border-gray-300 p-3 text-left">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {csvData.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-gray-50 even:bg-gray-50">
                                            <td className="border border-gray-300 p-2">{row.serial}</td>
                                            <td className="border border-gray-300 p-2">{row.ipAddress}</td>
                                            <td className="border border-gray-300 p-2">{row.machineNumber}</td>
                                            <td className="border border-gray-300 p-2">{row.signalStatus}</td>
                                            <td className="border border-gray-300 p-2">{row.totalSignals}</td>
                                            <td className="border border-gray-300 p-2">{row.cycleTime}</td>
                                            <td className="border border-gray-300 p-2">{row.productionCount}</td>
                                            <td className="border border-gray-300 p-2">{row.operatingTime}</td>
                                            <td className="border border-gray-300 p-2">{row.downtime}</td>
                                            <td className="border border-gray-300 p-2">{row.timestamp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-center mt-6">
                            <Button onClick={handleExport} className="w-full sm:w-auto flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export as CSV
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
            />
        </>
    );
}
