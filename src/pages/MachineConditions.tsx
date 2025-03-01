
import { useState, useEffect } from "react";
import { useMachineStore } from "@/lib/machine-service";
import { MachineList } from "@/components/MachineList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

const MachineConditions = () => {
  const { machines, deleteMachine } = useMachineStore();
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [signalLogs, setSignalLogs] = useState<Array<{
    id: string;
    machineId: string;
    status: "0" | "1";
    timestamp: string;
    reason: string;
  }>>([]);
  const [newLogReason, setNewLogReason] = useState("");

  // Debugging
  useEffect(() => {
    console.log("Selected machine:", selectedMachine);
    console.log("Available machines:", machines);
  }, [selectedMachine, machines]);

  const handleMachineClick = (machineId: string) => {
    console.log("Machine clicked:", machineId);
    setSelectedMachine(machineId);
  };

  const handleClosePanel = () => {
    setSelectedMachine(null);
  };

  const addSignalLog = (machineId: string, status: "0" | "1") => {
    if (!newLogReason && status === "0") return;
    
    const newLog = {
      id: Date.now().toString(),
      machineId,
      status,
      timestamp: new Date().toLocaleTimeString(),
      reason: status === "1" ? "Start" : newLogReason,
    };

    setSignalLogs([newLog, ...signalLogs]);
    setNewLogReason("");
  };

  const selectedMachineData = machines.find(m => m.id === selectedMachine);

  return (
    <div className="container mx-auto p-6 flex h-[calc(100vh-4rem)]">
      {/* Left sidebar with machines list */}
      <div className="w-64 mr-6 border-r pr-4">
        <h2 className="text-xl font-semibold mb-4">Machines</h2>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-2">
            {machines.map((machine) => (
              <div 
                key={machine.id}
                onClick={() => handleMachineClick(machine.id)}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedMachine === machine.id 
                    ? "bg-primary/10 border-l-4 border-primary" 
                    : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    machine.latestData?.signalON === "1" ? "bg-green-500" : "bg-red-500"
                  }`} />
                  <div>
                    <div className="font-medium">Machine {machine.latestData?.machineNumber || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      S/N: {machine.latestData?.serialNumber || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {selectedMachine ? (
          <div className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">
                Machine {selectedMachineData?.latestData?.machineNumber} Details
              </h1>
              <Button variant="ghost" size="icon" onClick={handleClosePanel}>
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
                        <TableCell>{selectedMachineData?.latestData?.serialNumber}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">IP Address</TableCell>
                        <TableCell>{selectedMachineData?.latestData?.ipAddress}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Status</TableCell>
                        <TableCell className={selectedMachineData?.latestData?.signalON === "1" ? "text-green-600" : "text-red-600"}>
                          {selectedMachineData?.latestData?.signalON === "1" ? "Running" : "Stopped"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Cycle Time</TableCell>
                        <TableCell>{parseFloat(selectedMachineData?.latestData?.cycleTime || "0").toFixed(2)} s</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Production Count</TableCell>
                        <TableCell>{selectedMachineData?.latestData?.productionResults}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Operating Time</TableCell>
                        <TableCell>{selectedMachineData?.latestData?.operatingTime} s</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Downtime</TableCell>
                        <TableCell>{selectedMachineData?.latestData?.downtime} s</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Last Updated</TableCell>
                        <TableCell>{selectedMachineData?.latestTimestamp}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Signal History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-4">
                      {selectedMachineData?.latestData?.signalON === "0" ? (
                        <>
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="reason">Downtime Reason</Label>
                            <Select value={newLogReason} onValueChange={setNewLogReason}>
                              <SelectTrigger id="reason">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="breakdown">Breakdown</SelectItem>
                                <SelectItem value="setup">Setup/Changeover</SelectItem>
                                <SelectItem value="material">Material Shortage</SelectItem>
                                <SelectItem value="operator">No Operator</SelectItem>
                                <SelectItem value="quality">Quality Issue</SelectItem>
                                <SelectItem value="planned">Planned Downtime</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            onClick={() => addSignalLog(selectedMachine, "0")}
                            disabled={!newLogReason}>
                            Record
                          </Button>
                        </>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => addSignalLog(selectedMachine, "1")}>
                          Record Running Status
                        </Button>
                      )}
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signalLogs
                        .filter(log => log.machineId === selectedMachine)
                        .map(log => (
                          <TableRow key={log.id}>
                            <TableCell className={log.status === "1" ? "text-green-600" : "text-red-600"}>
                              {log.status === "1" ? "Running" : "Stopped"}
                            </TableCell>
                            <TableCell>{log.timestamp}</TableCell>
                            <TableCell>{log.reason}</TableCell>
                          </TableRow>
                        ))}
                      {signalLogs.filter(log => log.machineId === selectedMachine).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            No signal logs recorded
                          </TableCell>
                        </TableRow>
                      )}
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
                          {selectedMachineData?.latestData?.operatingTime && selectedMachineData?.latestData?.downtime
                            ? (parseInt(selectedMachineData.latestData.operatingTime) / 
                              (parseInt(selectedMachineData.latestData.operatingTime) + parseInt(selectedMachineData.latestData.downtime)) * 100).toFixed(1)
                            : "0"}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ 
                            width: `${selectedMachineData?.latestData?.operatingTime && selectedMachineData?.latestData?.downtime
                              ? (parseInt(selectedMachineData.latestData.operatingTime) / 
                                (parseInt(selectedMachineData.latestData.operatingTime) + parseInt(selectedMachineData.latestData.downtime)) * 100)
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
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <h2 className="text-xl font-medium mb-2">Select a machine</h2>
              <p>Choose a machine from the sidebar to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineConditions;
