
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell className={log.status === "1" ? "text-green-600" : "text-red-600"}>
                  {log.status === "1" ? "Running" : "Stopped"}
                </TableCell>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>{log.reason.replace(/\b\w/g, (char) => char.toUpperCase())}</TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
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
  );
}
