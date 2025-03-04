
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Rectangle } from "recharts";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  
  // Get current page logs
  const currentLogs = filteredLogs.slice(
    currentPage * rowsPerPage, 
    (currentPage + 1) * rowsPerPage
  );
  
  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Prepare data for the timeline chart
  // We'll now change to a vertical bar chart format, similar to the image
  const timelineData = filteredLogs.map((log, index) => ({
    index,
    status: log.status === "1" ? 1 : 0,
    id: log.id,
    timestamp: log.timestamp,
    reason: log.reason
  }));

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

  // Custom bar shape to create thin vertical bars
  const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props;
    const barWidth = 4; // Make the bars thinner
    const color = value === 1 ? "#22c55e" : "#ef4444"; // Green for running, Red for stopped
    
    // Center the bar in its assigned space
    const xPos = x + (width - barWidth) / 2;
    
    return (
      <Rectangle
        x={xPos}
        y={y}
        width={barWidth}
        height={height}
        fill={color}
      />
    );
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
          
          <div className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <span>Automatic simulation is active. The system is generating both running and downtime records.</span>
          </div>
        </div>

        {/* Timeline Chart - Updated to match the requested style */}
        <div className="mb-6 bg-gray-200 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Machine Status Timeline</h3>
          <div className="flex justify-between mb-1 text-xs">
            <span>Time</span>
            <span>Time</span>
          </div>
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timelineData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                barSize={4}
              >
                <Bar 
                  dataKey="status" 
                  fill="#000" 
                  shape={<CustomBar />}
                  isAnimationActive={false}
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
            {currentLogs.map(log => (
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
        
        {/* Pagination */}
        {filteredLogs.length > rowsPerPage && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * rowsPerPage + 1} to {Math.min((currentPage + 1) * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <div className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
