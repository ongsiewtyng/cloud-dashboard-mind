import React, {useEffect, useState, useCallback} from "react";
import { Clock, Edit2, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type SignalLog, getSignalLogs } from "@/lib/signal-service";

interface LogsTableProps {
  machineId: string;
  signalLogs: SignalLog[];
  onUpdateReason: (logId: string, reason: string) => Promise<boolean>;
  onLogSelect?: (logId: string) => void;
}

export function LogsTable({ machineId, signalLogs, onUpdateReason, onLogSelect }: LogsTableProps) {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const rowsPerPage = 5;
  const [activeDuration, setActiveDuration] = useState<string | null>(null);
  
  // Find the active log (most recent log)
  const activeLog = signalLogs[0];

  // Listen for timeline deselection events
  useEffect(() => {
    const handleDeselect = () => {
      setSelectedLogId(null);
    };

    window.addEventListener('timeline-deselect', handleDeselect);
    return () => {
      window.removeEventListener('timeline-deselect', handleDeselect);
    };
  }, []);

  // Calculate and update duration for active log
  useEffect(() => {
    if (!activeLog) return;

    const updateDuration = () => {
      const now = new Date();
      const [hours, minutes, seconds = "00"] = activeLog.timestamp.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
      
      // Calculate duration
      const diffMs = now.getTime() - startDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours2 = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      // Format duration
      const newDuration = hours2 > 0 
        ? `${hours2}h ${mins}m`
        : `${mins}m`;
      setActiveDuration(newDuration);

      // Schedule next update at the start of next minute
      const nextMinute = new Date(now);
      nextMinute.setMinutes(now.getMinutes() + 1, 0, 0);
      const delay = nextMinute.getTime() - now.getTime();
      
      return setTimeout(updateDuration, delay);
    };

    const timeoutId = updateDuration();
    return () => clearTimeout(timeoutId);
  }, [activeLog]);

  const totalPages = Math.ceil(signalLogs.length / rowsPerPage);
  const currentLogs = signalLogs.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  // Reset to first page when logs change significantly
  useEffect(() => {
    setCurrentPage(0);
  }, [signalLogs.length]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // Predefined reasons
  const reasonOptions = [
    "Network Issue",
    "Power Outage",
    "System Maintenance",
    "Software Bug",
    "Hardware Failure",
    "Other",
  ];

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit",
    });
  };

  // Convert text to Title Case
  const toTitleCase = (text: string) => {
    return text
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleEditClick = (log: SignalLog) => {
    setEditingLogId(log.id);
    setEditReason(log.reason || "");
    setSelectedReason(null);
  };

  const handleSaveClick = async (logId: string) => {
    if (!editReason.trim()) return;
    setIsUpdating(true);
    try {
      const success = await onUpdateReason(logId, toTitleCase(editReason));
      if (success) {
        setEditingLogId(null);
        setSelectedReason(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelClick = () => {
    setEditingLogId(null);
    setEditReason("");
    setSelectedReason(null);
  };

  const handleRowClick = (logId: string) => {
    // Toggle selection
    if (selectedLogId === logId) {
      setSelectedLogId(null);
      onLogSelect?.(null);
    } else {
      setSelectedLogId(logId);
      onLogSelect?.(logId);
    }
  };

  return (
      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-md">
        <div className="py-2 px-4 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-slate-500 mr-2" />
            <span className="text-sm font-medium text-slate-700">Status Log Entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Page {currentPage + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50 text-xs text-slate-500">
              <th className="py-2 px-4 text-left font-medium">Time</th>
              <th className="py-2 px-4 text-left font-medium">Status</th>
              <th className="py-2 px-4 text-left font-medium">Duration</th>
              <th className="py-2 px-4 text-left font-medium">Reason</th>
              <th className="py-2 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {signalLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>No signal logs found</p>
                </td>
              </tr>
            ) : (
              currentLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className={`border-b hover:bg-slate-50 cursor-pointer ${selectedLogId === log.id ? 'bg-slate-100' : ''}`}
                  onClick={() => handleRowClick(log.id)}
                >
                  <td className="py-3 px-4 text-sm">{formatTime(log.timestamp)}</td>
                  <td className="py-3 px-4">
                    <Badge className={`${log.status === "1" ? "!bg-green-100 !text-green-800" : "!bg-red-100 !text-red-800"}`}>
                      {log.status === "1" ? "Running" : "Down"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {log === activeLog ? (
                      <span className="text-blue-600 font-medium">{activeDuration || '0m'}</span>
                    ) : (
                      <span>{log.duration || '-'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {editingLogId === log.id ? (
                      <div className="flex flex-col gap-2">
                        <Select
                          value={selectedReason || ""}
                          onValueChange={(value) => {
                            setSelectedReason(value);
                            setEditReason(value === "Other" ? "" : value);
                          }}
                        >
                          <SelectTrigger className="w-full text-sm py-1 h-8">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {reasonOptions.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(selectedReason === "Other" || !selectedReason) && (
                          <Input
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            placeholder="Enter reason"
                            className="py-1 px-2 h-8 text-sm"
                            autoFocus
                          />
                        )}
                      </div>
                    ) : (
                      <span className={!log.reason && log.status === "0" ? "text-red-500 italic" : ""}>
                        {log.status === "0" ? toTitleCase(log.reason || "No reason provided") : "-"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.status === "0" && (
                      editingLogId === log.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveClick(log.id);
                            }}
                            disabled={isUpdating}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick();
                            }}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(log);
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  );
}
