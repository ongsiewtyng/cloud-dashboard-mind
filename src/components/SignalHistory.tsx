
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  reason: string;
}

interface SignalHistoryProps {
  machineId: string;
  signalLogs: SignalLog[];
  currentStatus: "0" | "1";
  onAddLog: (machineId: string, status: "0" | "1") => void;
  newLogReason: string;
  setNewLogReason: (reason: string) => void;
}

export function SignalHistory({ 
  machineId, 
  signalLogs, 
  currentStatus, 
  onAddLog, 
  newLogReason, 
  setNewLogReason 
}: SignalHistoryProps) {
  const filteredLogs = signalLogs.filter(log => log.machineId === machineId);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");

  // Prepare data for the timeline chart
  const timelineData = filteredLogs.map(log => ({
    timestamp: log.timestamp,
    status: log.status === "1" ? 1 : 0,
    id: log.id,
    reason: log.reason
  })).reverse();

  const handleEditReason = (logId: string, currentReason: string) => {
    setSelectedLog(logId);
    setEditReason(currentReason);
  };

  const saveReason = () => {
    if (!selectedLog) return;
    
    // Find the log in the signalLogs array
    const updatedLogs = signalLogs.map(log => {
      if (log.id === selectedLog) {
        return { ...log, reason: editReason };
      }
      return log;
    });
    
    // Update the signalLogs state
    // Note: This requires updating the parent component's state, which would need to be passed as props
    // For now, we're just closing the edit mode
    setSelectedLog(null);
    setEditReason("");
    
    // In a real implementation, you would call a function passed as props to update the logs
    console.log("Updated logs:", updatedLogs);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Signal History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div className="flex gap-4">
            {currentStatus === "0" ? (
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
                <div className="flex items-end">
                  <Button
                      onClick={() => onAddLog(machineId, "0")}
                      disabled={!newLogReason}>
                    Record
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => onAddLog(machineId, "1")}>
                Record Running Status
              </Button>
            )}
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Machine Status Timeline</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => value === 1 ? "On" : "Off"} />
                <YAxis 
                  dataKey="timestamp" 
                  type="category" 
                  width={60} 
                  tick={{ fontSize: 12 }} 
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value === 1 ? "Running" : "Stopped", 
                    "Status"
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border shadow-sm">
                          <p className="text-sm">{`Time: ${data.timestamp}`}</p>
                          <p className="text-sm font-medium">{`Status: ${data.status === 1 ? "Running" : "Stopped"}`}</p>
                          {data.status === 0 && data.reason && (
                            <p className="text-sm">{`Reason: ${data.reason.replace(/\b\w/g, (char) => char.toUpperCase())}`}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="status" 
                  fill={(data) => data.status === 1 ? "#22c55e" : "#ef4444"} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell className={log.status === "1" ? "text-green-600" : "text-red-600"}>
                  {log.status === "1" ? "Running" : "Stopped"}
                </TableCell>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>
                  {selectedLog === log.id ? (
                    <Select value={editReason} onValueChange={setEditReason}>
                      <SelectTrigger>
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
                  ) : (
                    log.reason.replace(/\b\w/g, (char) => char.toUpperCase())
                  )}
                </TableCell>
                <TableCell>
                  {log.status === "0" && (
                    selectedLog === log.id ? (
                      <Button size="sm" onClick={saveReason}>Save</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleEditReason(log.id, log.reason)}>
                        Edit
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  No signal logs recorded
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
