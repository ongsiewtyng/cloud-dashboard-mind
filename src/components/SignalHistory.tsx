
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, Clock } from "lucide-react";
import { TimelineChart } from "./signal/TimelineChart";
import { LogsTable } from "./signal/LogsTable";
import { useTimelineData } from "@/hooks/useTimelineData";
import { type SignalLog } from "@/lib/signal-service";

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
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  const isSimulationHours = hours >= 8 && hours < 17; // 8 AM to 5 PM
  
  return (
    <div className="space-y-6">
      {/* Fixed Timeline Chart Section */}
      <Card className="shadow-md border-slate-200 sticky top-0 z-30 bg-white">
        <CardHeader className="pb-2 border-b bg-slate-50">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivitySquare className="h-5 w-5 text-indigo-500" />
              <span>Signal Timeline</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              <Clock className="h-4 w-4 text-slate-500" />
              <span>Current time: {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}</span>
              {isSimulationHours ? (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Simulation Active</span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Simulation Paused (8AM-5PM only)</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <TimelineChart timelineData={timelineData} />
        </CardContent>
      </Card>
      
      {/* Log Table Section */}
      <Card className="shadow-md border-slate-200">
        <CardHeader className="pb-2 border-b bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-indigo-500" />
            <span>Signal History Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3 mb-4">
            <span className="font-medium">Real-time Monitoring:</span> Machine status is being tracked in real-time with persistent storage. Data is saved to Firebase and will continue updating even when you're away.
          </div>
          
          <LogsTable 
            filteredLogs={signalLogs} 
            onUpdateReason={updateLogReason} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
