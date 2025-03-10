import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare } from "lucide-react";
import { TimelineChart } from "./signal/TimelineChart";
import { LogsTable } from "./signal/LogsTable";
import { useTimelineData } from "@/hooks/useTimelineData";
import { type SignalLog, getSignalLogs } from "@/lib/signal-service";

interface SignalHistoryProps {
  machineId: string;
  signalLogs: SignalLog[];
  currentStatus: "0" | "1";
  onAddLog: (machineId: string, status: "0" | "1") => void;
  updateLogReason: (logId: string, reason: string) => Promise<boolean>;
}

export function SignalHistory({ 
  machineId, 
  signalLogs,
  currentStatus, 
  onAddLog,
  updateLogReason
}: SignalHistoryProps) {
  const timelineData = useTimelineData(signalLogs, machineId);

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-2 border-b bg-slate-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-indigo-500" />
          <span>Signal History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <TimelineChart 
          timelineData={timelineData} 
          startTime="08:00"
          endTime="17:00"
        />
        <LogsTable
          machineId={machineId}
          signalLogs={signalLogs}
          onUpdateReason={updateLogReason}
        />
      </CardContent>
    </Card>
  );
}
