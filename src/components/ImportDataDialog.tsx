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
import { db } from "@/lib/firebase"; // Import Firebase Realtime DB instance
import { ref, set, update, get } from "firebase/database";

export function ImportDataDialog() {
    const [open, setOpen] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [subheaders, setSubheaders] = useState<string[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target?.result) {
                    const decoder = new TextDecoder("windows-1252");
                    const text = decoder.decode(e.target.result as ArrayBuffer);

                    const { data } = Papa.parse(text, {
                        header: false, // Read raw data, not as key-value pairs
                        skipEmptyLines: true
                    });

                    if (data.length < 2) {
                        console.error("Invalid CSV: Not enough rows");
                        return;
                    }

                    const headers = data[0] as string[]; // First row as headers
                    const subheaders = data[1] as string[]; // Second row as subheaders
                    const csvData = data.slice(2).map(row => Object.values(row)); // Convert remaining rows into array format

                    setHeaders(headers);
                    setSubheaders(subheaders);
                    setCsvData(csvData);

                    console.log("Headers:", headers);
                    console.log("Subheaders:", subheaders);
                    console.log("Data:", csvData);

                    setOpen(true);
                }
                event.target.value = ""; // Reset file input
            };

            reader.readAsArrayBuffer(file);
        }
    };


    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

    const saveData = async () => {
        if (!subheaders.includes("SERIAL")) {
            console.error("SERIAL column not found in the CSV headers.");
            return;
        }

        // Find index of the SERIAL column
        const serialIndex = subheaders.indexOf("SERIAL");

        if (serialIndex === -1) {
            console.error("SERIAL column index not found.");
            return;
        }

        const machinesRef = ref(db, "machines");

        //Fetch existing machines
        const snapshot = await get(machinesRef);

        // Store existing machine serials
        const existingSerialNumbers = new Set(csvData.map(row => row[serialIndex]));

        console.log("Existing Machines (Serial Numbers):", existingSerialNumbers);

        csvData.forEach(row => {
            if (!row || row.length === 0) return;
            const serialNumber = row[serialIndex];
            if (!serialNumber) return;


            const machineData = {
                serialNumber: row[serialIndex] || "",
                ipAddress: row[subheaders.indexOf("IPADDRESS")] || "",
                timestamp: row[subheaders.indexOf("TIMESTAMP")] || "",
                signalON: row[subheaders.indexOf("D1")] || "0",
                totalSignal: row[subheaders.indexOf("E1")] || "0",
                cycleTime: row[subheaders.indexOf("E3")] || "0:00:00",
                productionResults: row[subheaders.indexOf("C1")] || "0",
                machineNumber: row[subheaders.indexOf("M1")] || "",
                operatingTime: row[subheaders.indexOf("OT")] || "0:00:00",
                downtime: row[subheaders.indexOf("UT")] || "0:00:00"
            };

            const machinePath = `machines/${serialNumber}`;
            const timestampKey = `timestamp_${machineData.timestamp}`;

            update(ref(db, machinePath), {
                latestTimestamp: machineData.timestamp,
                latestData: machineData
            });

            set(ref(db, `${machinePath}/dataHistory/${timestampKey}`), machineData);
        });
    }


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
                                {/* Dynamically generated headers */}
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    {(Array.isArray(headers) ? headers : []).map((header, index) => (
                                        <th key={index} className="border border-gray-300 p-3 text-left">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                {/* Dynamically generated subheaders */}
                                <thead className="bg-gray-50">
                                <tr>
                                    {(Array.isArray(subheaders) ? subheaders : []).map((subheader, index) => (
                                        <th key={index} className="border border-gray-300 p-3 text-left">
                                            {subheader}
                                        </th>
                                    ))}
                                </tr>
                                </thead>

                                {/* Dynamically generated rows */}
                                <tbody className="bg-white">
                                {csvData.map((row, index) => (
                                    <tr key={index}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="border border-gray-300 p-3">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-center mt-6 gap-4">
                            <Button onClick={saveData} className="w-full sm:w-auto flex items-center gap-2">
                                Save Data
                            </Button>
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
