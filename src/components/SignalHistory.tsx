
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TimelineChart } from "./signal/TimelineChart";
import { LogsTable } from "./signal/LogsTable";
import { ActivitySquare } from "lucide-react";
import { useTimelineData } from "@/hooks/useTimelineData";

interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
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
  const timelineData = useTimelineData(signalLogs, machineId);

  const handleAddLog = (status: "0" | "1") => {
    onAddLog(machineId, status);
    
    // Show success toast after calling onAddLog
    if (status === "1") {
      toast.success("Machine running status recorded successfully");
    } else {
      toast.success("Machine downtime recorded successfully");
    }
  };

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-2 border-b bg-slate-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-indigo-500" />
          <span>Signal History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <TimelineChart timelineData={timelineData} />
        <LogsTable filteredLogs={filteredLogs} />
      </CardContent>
    </Card>
  );
}
