
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
  
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  
  const currentLogs = filteredLogs.slice(
    currentPage * rowsPerPage, 
    (currentPage + 1) * rowsPerPage
  );
  
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

  // Convert time string to minutes since start of day for position calculation
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Define workday time range
  const startTime = "08:00";
  const endTime = "17:00";
  
  // Calculate total minutes in the time range
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalMinutes = endMinutes - startMinutes;

  // Prepare timeline data with normalized positions
  const prepareTimelineData = () => {
    // Sort logs by timestamp
    const sortedLogs = [...filteredLogs].sort((a, b) => {
      return timeToMinutes(a.timestamp) - timeToMinutes(b.timestamp);
    });

    return sortedLogs.map((log, index) => {
      // Calculate x-position based on time (as a percentage of the total range)
      const logMinutes = timeToMinutes(log.timestamp);
      const normalizedPosition = Math.max(0, Math.min(1, (logMinutes - startMinutes) / totalMinutes));

      return {
        id: log.id,
        status: log.status === "1" ? 1 : 0,
        position: normalizedPosition * 100, // As percentage
        timestamp: log.timestamp,
        reason: log.reason
      };
    });
  };

  const timelineData = prepareTimelineData();

  const handleEditReason = (logId: string, currentReason: string) => {
    setSelectedLog(logId);
    setEditReason(currentReason);
  };

  const saveReason = () => {
    if (!selectedLog) return;
    
    const updatedLogs = signalLogs.map(log => {
      if (log.id === selectedLog) {
        return { ...log, reason: editReason };
      }
      return log;
    });
    
    setSelectedLog(null);
    setEditReason("");
    
    console.log("Updated logs:", updatedLogs);
  };

  // Custom bar component for the timeline
  const CustomBar = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    const barWidth = 4;
    const color = value === 1 ? "#22c55e" : "#ef4444"; // Green for running, Red for stopped
    
    // Calculate position based on timestamp
    const xPos = payload.position / 100 * width;
    
    return (
      <>
        <Rectangle
          x={xPos - barWidth/2}
          y={y}
          width={barWidth}
          height={height}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1}
        />
      </>
    );
  };

  // Custom chart component with fixed axis
  const TimelineChart = () => {
    return (
      <div className="relative h-16 w-full bg-white border border-slate-200 rounded">
        {/* Time labels */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-slate-600 px-2">
          <span>{startTime}</span>
          <span>{endTime}</span>
        </div>
        
        {/* Chart background */}
        <div className="absolute top-5 left-0 right-0 bottom-0">
          {/* Signal bars */}
          {timelineData.map((data, index) => (
            <div 
              key={data.id}
              className="absolute top-0 bottom-0" 
              style={{ 
                left: `${data.position}%`,
                width: '4px',
                marginLeft: '-2px', // Center the bar
                backgroundColor: data.status === 1 ? '#22c55e' : '#ef4444',
                border: '1px solid #ffffff',
              }}
            />
          ))}
        </div>
      </div>
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

        <div className="mb-6 bg-slate-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Machine Status Timeline</h3>
          <TimelineChart />
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
