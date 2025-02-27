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

export function ImportDataDialog() {
    const [open, setOpen] = useState(false);
    const [csvData, setCsvData] = useState<string[][]>([]); // Parsed CSV data

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target?.result) {
                    const text = e.target.result.toString();
                    const { data } = Papa.parse(text, {
                        header: true, // Convert to JSON
                        skipEmptyLines: true
                    });

                    console.log("Parsed JSON Data:", data); // Debugging
                    setCsvData(data);
                    setOpen(true);

                    // Reset file input so it can upload the same file again
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
            {/* Upload Button */}
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

                        {/* Table Container */}
                        <div className="overflow-x-auto border rounded-lg max-h-[60vh] mt-4">
                            <table className="w-full border-collapse border border-gray-300 text-sm sm:text-base">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    {csvData.length > 0 &&
                                        Object.keys(csvData[0]).map((header, index) => (
                                            <th key={index} className="border border-gray-300 p-3 text-left">
                                                {header}
                                            </th>
                                        ))}
                                </tr>
                                </thead>
                                <tbody className="bg-white">
                                {csvData.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 even:bg-gray-50">
                                        {Object.values(row).map((cell, cellIndex) => (
                                            <td key={cellIndex} className="border border-gray-300 p-2">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Export Button */}
                        <div className="flex justify-center mt-6">
                            <Button onClick={handleExport} className="w-full sm:w-auto flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export as CSV
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden File Input */}
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
