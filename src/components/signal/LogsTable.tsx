import React, {useEffect, useState} from "react";
import { Clock, Edit2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type SignalLog, getSignalLogs } from "@/lib/signal-service";


interface LogsTableProps {
  machineId: string;
  onUpdateReason: (logId: string, reason: string) => Promise<boolean>;
}

export function LogsTable({ machineId, onUpdateReason }: LogsTableProps) {
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState("");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await getSignalLogs(machineId);
        setLogs(fetchedLogs as SignalLog[]);
      } catch (error) {
        console.error("Failed to fetch signal logs:", error);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [machineId]);

  const totalPages = Math.ceil(logs.length / rowsPerPage);
  const currentLogs = logs.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

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
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        setLogs((prevLogs) =>
            prevLogs.map((log) => (log.id === logId ? { ...log, reason: toTitleCase(editReason) } : log))
        );
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

  return (
      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-md">
        <div className="py-2 px-4 bg-slate-50 border-b flex items-center">
          <Clock className="h-4 w-4 text-slate-500 mr-2" />
          <span className="text-sm font-medium text-slate-700">Status Log Entries</span>
        </div>

        {loading ? (
            <div className="p-4 text-center text-slate-500">Loading logs...</div>
        ) : (
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
              {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                      <p>No signal logs found</p>
                    </td>
                  </tr>
              ) : (
                  currentLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm">{formatTime(log.timestamp)}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${log.status === "1" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {log.status === "1" ? "Running" : "Down"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm">{log.duration || "-"}</td>
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
                                {selectedReason === "Other" && (
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
                                    <div className="flex gap-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                                            onClick={() => handleSaveClick(log.id)}
                                            disabled={isUpdating}
                                        >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Save
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-7 px-2 text-xs bg-red-600 hover:bg-red-700"
                                            onClick={handleCancelClick}
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
                                        onClick={() => handleEditClick(log)}
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
        )}
      </div>
  );
}
