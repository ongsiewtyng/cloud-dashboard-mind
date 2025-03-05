
import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  reason: string;
}

interface LogsTableProps {
  filteredLogs: SignalLog[];
}

export function LogsTable({ filteredLogs }: LogsTableProps) {
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

  const handleEditReason = (logId: string, currentReason: string) => {
    setSelectedLog(logId);
    setEditReason(currentReason);
  };

  const saveReason = () => {
      if (!selectedLog) return;

      // Find the log and update its reason locally
      const logIndex = filteredLogs.findIndex(log => log.id === selectedLog);
      if (logIndex !== -1) {
        filteredLogs[logIndex].reason = editReason;
      }

      setSelectedLog(null);
      setEditReason("");
    };
  
  return (
    <>
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
                      <SelectItem value="setup/changeover">Setup/Changeover</SelectItem>
                      <SelectItem value="material shortage">Material Shortage</SelectItem>
                      <SelectItem value="no operator">No Operator</SelectItem>
                      <SelectItem value="quality issue">Quality Issue</SelectItem>
                      <SelectItem value="planned downtime">Planned Downtime</SelectItem>
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
    </>
  );
}
