
import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
  reason: string;
}

interface LogsTableProps {
  filteredLogs: SignalLog[];
  onUpdateReason?: (logId: string, reason: string) => Promise<boolean>;
}

export function LogsTable({ filteredLogs, onUpdateReason }: LogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
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

  const saveReason = async () => {
    if (!selectedLog || !onUpdateReason) {
      setSelectedLog(null);
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await onUpdateReason(selectedLog, editReason);
      
      if (success) {
        toast.success("Downtime reason updated successfully");
      } else {
        toast.error("Failed to update downtime reason");
      }
    } catch (error) {
      console.error("Error saving reason:", error);
      toast.error("An error occurred while updating the reason");
    } finally {
      setIsSaving(false);
      setSelectedLog(null);
      setEditReason("");
    }
  };
  
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
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
              <TableCell>{log.duration || "-"}</TableCell>
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
                  log.reason ? log.reason.replace(/\b\w/g, (char) => char.toUpperCase()) : "-"
                )}
              </TableCell>
              <TableCell>
                {log.status === "0" && onUpdateReason && (
                  selectedLog === log.id ? (
                    <Button size="sm" onClick={saveReason} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
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
              <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
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
