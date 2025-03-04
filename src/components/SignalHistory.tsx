
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogReasonSelector } from "./signal/LogReasonSelector";
import { TimelineChart } from "./signal/TimelineChart";
import { LogsTable } from "./signal/LogsTable";

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

    return sortedLogs.map((log) => {
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Signal History</CardTitle>
      </CardHeader>
      <CardContent>
        <LogReasonSelector 
          currentStatus={currentStatus}
          newLogReason={newLogReason}
          setNewLogReason={setNewLogReason}
          onAddLog={handleAddLog}
        />

        <TimelineChart timelineData={timelineData} />

        <LogsTable filteredLogs={filteredLogs} />
      </CardContent>
    </Card>
  );
}
