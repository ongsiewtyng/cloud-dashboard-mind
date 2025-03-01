
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MachineRecord } from "@/lib/machine-service";

interface MachineDetailsProps {
  machineData: MachineRecord | undefined;
  onClose: () => void;
}

export function MachineDetails({ machineData, onClose }: MachineDetailsProps) {
  if (!machineData) return null;
  
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Machine {machineData.latestData?.machineNumber} Details
        </h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Machine Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Serial No.</TableCell>
                  <TableCell>{machineData.latestData?.serialNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IP Address</TableCell>
                  <TableCell>{machineData.latestData?.ipAddress}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell className={machineData.latestData?.signalON === "1" ? "text-green-600" : "text-red-600"}>
                    {machineData.latestData?.signalON === "1" ? "Running" : "Stopped"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Cycle Time</TableCell>
                  <TableCell>{parseFloat(machineData.latestData?.cycleTime || "0").toFixed(2)} s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Production Count</TableCell>
                  <TableCell>{machineData.latestData?.productionResults}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Operating Time</TableCell>
                  <TableCell>{machineData.latestData?.operatingTime} s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Downtime</TableCell>
                  <TableCell>{machineData.latestData?.downtime} s</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Updated</TableCell>
                  <TableCell>{machineData.latestTimestamp}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Production Efficiency</span>
                  <span>
                    {machineData.latestData?.operatingTime && machineData.latestData?.downtime
                      ? (parseInt(machineData.latestData.operatingTime) / 
                        (parseInt(machineData.latestData.operatingTime) + parseInt(machineData.latestData.downtime)) * 100).toFixed(1)
                      : "0"}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ 
                      width: `${machineData.latestData?.operatingTime && machineData.latestData?.downtime
                        ? (parseInt(machineData.latestData.operatingTime) / 
                          (parseInt(machineData.latestData.operatingTime) + parseInt(machineData.latestData.downtime)) * 100)
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
