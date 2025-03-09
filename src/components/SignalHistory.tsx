import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare } from "lucide-react";
import { TimelineChart } from "./signal/TimelineChart";
import { LogsTable } from "./signal/LogsTable";
import { useTimelineData } from "@/hooks/useTimelineData";
import { type SignalLog, getSignalLogs } from "@/lib/signal-service";

interface SignalHistoryProps {
  machineId: string;
  currentStatus: "0" | "1";
  onAddLog: (machineId: string, status: "0" | "1") => void;
  updateLogReason: (logId: string, reason: string) => Promise<boolean>;
}

export function SignalHistory({ 
  machineId, 
  currentStatus, 
  onAddLog,
  updateLogReason
}: SignalHistoryProps) {
  const [logs, setLogs] = useState<SignalLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await getSignalLogs(machineId);
        console.log('SignalHistory fetched logs:', fetchedLogs);
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to fetch signal logs:", error);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [machineId]);

  const timelineData = useTimelineData(logs, machineId);

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-2 border-b bg-slate-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <ActivitySquare className="h-5 w-5 text-indigo-500" />
          <span>Signal History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading timeline...</div>
        ) : (
          <>
            <TimelineChart 
              timelineData={timelineData} 
              startTime="08:00"
              endTime="17:00"
            />
            <LogsTable
              machineId={machineId}
              onUpdateReason={updateLogReason}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
