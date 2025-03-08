
import { ref, push, get, set, query, orderByChild, equalTo, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export interface SignalLog {
  id: string;
  machineId: string;
  status: "0" | "1";
  timestamp: string;
  endTimestamp?: string;
  duration?: string;
  reason: string;
  date: string; // Store the date for filtering
}

// Firebase references
const signalLogsRef = ref(db, "signalLogs");

// Get today's date string in YYYY-MM-DD format for data partitioning
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Add a new signal log to Firebase
export const addSignalLog = async (
    machineId: string,
    status: "0" | "1",
    timestamp: string,
    endTimestamp?: string,
    duration?: string,
    reason: string = ""
): Promise<SignalLog | null> => {
  try {
    console.log("addSignalLog called with:", { machineId, status, timestamp, reason });

    // Check for duplicate logs
    const exists = await checkForDuplicateLog(machineId, status, timestamp);
    if (exists) {
      console.log("Duplicate log detected, not adding to Firebase");
      return null;
    }

    // Create new log entry
    const newLogRef = push(signalLogsRef);
    const date = getTodayDateString();
    const newLog: SignalLog = {
      id: newLogRef.key || "",
      machineId,
      status,
      timestamp,
      endTimestamp,
      duration,
      reason: status === "0" ? reason : "",
      date
    };

    // Save to Firebase
    await set(newLogRef, newLog);
    console.log("Signal log added to Firebase:", newLog);

    // Update the previous log's end time and duration if this is a status change
    await updatePreviousLog(machineId, status, timestamp);

    return newLog;
  } catch (error) {
    console.error("Error adding signal log:", error);
    return null;
  }
};

// Check if a similar log exists at the same timestamp
const checkForDuplicateLog = async (
  machineId: string,
  status: "0" | "1",
  timestamp: string
): Promise<boolean> => {
  try {
    // Get recent logs for this machine
    const recentLogsQuery = query(
      signalLogsRef,
      orderByChild("machineId"),
      equalTo(machineId)
    );
    
    const snapshot = await get(recentLogsQuery);
    if (!snapshot.exists()) return false;
    
    // Convert timestamp to date object for comparison
    const newLogTime = new Date(`1970-01-01T${timestamp}Z`).getTime();
    
    // Check for duplicate or conflicting logs
    let isDuplicate = false;
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as SignalLog;
      
      // Only check recent logs (within the last minute)
      const logTime = new Date(`1970-01-01T${log.timestamp}Z`).getTime();
      const timeDiff = Math.abs(newLogTime - logTime);
      
      if (timeDiff < 1000) { // Within 1 second
        if (log.status === status) {
          isDuplicate = true;
          return true; // Break the forEach loop
        }
      }
    });
    
    return isDuplicate;
  } catch (error) {
    console.error("Error checking for duplicate log:", error);
    return false;
  }
};

// Update previous log with end time and duration
// Update previous log with end time and duration
const updatePreviousLog = async (
    machineId: string,
    newStatus: "0" | "1",
    currentTimestamp: string
): Promise<void> => {
  try {
    // Get the most recent log for this machine
    const logsQuery = query(
        signalLogsRef,
        orderByChild("machineId"),
        equalTo(machineId)
    );

    const snapshot = await get(logsQuery);
    if (!snapshot.exists()) {
      console.log("No logs found for machineId:", machineId);
      return;
    }

    let mostRecentLog: SignalLog | null = null;
    let mostRecentKey = "";
    let mostRecentTime = 0;

    // Find the most recent log
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as SignalLog;
      const logTime = new Date(`1970-01-01T${log.timestamp}Z`).getTime();

      if (!mostRecentLog || logTime > mostRecentTime) {
        mostRecentLog = log;
        mostRecentKey = childSnapshot.key as string;
        mostRecentTime = logTime;
      }
    });

    if (!mostRecentLog) {
      console.log("No recent log found for machineId:", machineId);
      return;
    }

    // If we found a log and its status is different from the new one
    if (mostRecentLog.status !== newStatus) {
      // Calculate duration
      const startDate = new Date(`1970-01-01T${mostRecentLog.timestamp}Z`);
      const endDate = new Date(`1970-01-01T${currentTimestamp}Z`);

      // If end time is before start time, assume it's the next day
      if (endDate.getTime() < startDate.getTime()) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      const duration = diffHours > 0
          ? `${diffHours}h ${remainingMins}m`
          : `${remainingMins}m`;

      // Update the log
      await set(ref(db, `signalLogs/${mostRecentKey}`), {
        ...mostRecentLog,
        endTimestamp: currentTimestamp,
        duration
      });

      console.log("Updated previous log with end time and duration:", mostRecentKey);
    } else {
      console.log("Most recent log status is the same as new status, no update needed.");
    }
  } catch (error) {
    console.error("Error updating previous log:", error);
  }
};

// Get logs for a specific machine and date
export const getSignalLogs = async (machineId: string, date: string = getTodayDateString()): Promise<SignalLog[]> => {
  try {
    // Create a query to get logs for this machine and date
    const logsQuery = query(
      signalLogsRef,
      orderByChild("machineId"),
      equalTo(machineId)
    );
    
    const snapshot = await get(logsQuery);
    if (!snapshot.exists()) return [];
    
    const logs: SignalLog[] = [];
    
    // Filter logs for the requested date
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as SignalLog;
      if (log.date === date) {
        logs.push({
          ...log,
          id: childSnapshot.key as string
        });
      }
    });
    
    // Sort by timestamp, newest first
    return logs.sort((a, b) => {
      const aTime = new Date(`1970-01-01T${a.timestamp}Z`).getTime();
      const bTime = new Date(`1970-01-01T${b.timestamp}Z`).getTime();
      return bTime - aTime;
    });
  } catch (error) {
    console.error("Error fetching signal logs:", error);
    return [];
  }
};

// Listen for logs for a specific machine in real-time
export const subscribeToSignalLogs = (
  machineId: string, 
  callback: (logs: SignalLog[]) => void
) => {
  // Create a query to get logs for this machine
  const logsQuery = query(
    signalLogsRef,
    orderByChild("machineId"),
    equalTo(machineId)
  );
  
  // Set up a real-time listener
  const unsubscribe = onValue(logsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const logs: SignalLog[] = [];
    const today = getTodayDateString();
    
    // Filter logs for today
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as SignalLog;
      if (log.date === today) {
        logs.push({
          ...log,
          id: childSnapshot.key as string
        });
      }
    });
    
    // Sort by timestamp, newest first
    logs.sort((a, b) => {
      const aTime = new Date(`1970-01-01T${a.timestamp}Z`).getTime();
      const bTime = new Date(`1970-01-01T${b.timestamp}Z`).getTime();
      return bTime - aTime;
    });
    
    callback(logs);
  });
  
  // Return unsubscribe function
  return unsubscribe;
};

// Update the reason for a signal log
export const updateSignalLogReason = async (logId: string, reason: string): Promise<boolean> => {
  try {
    const logRef = ref(db, `signalLogs/${logId}`);
    const snapshot = await get(logRef);
    
    if (!snapshot.exists()) {
      console.error("Log not found:", logId);
      return false;
    }
    
    const log = snapshot.val() as SignalLog;
    
    // Only update if this is a downtime log
    if (log.status !== "0") {
      console.error("Cannot update reason for non-downtime log");
      return false;
    }
    
    // Update the reason
    await set(logRef, {
      ...log,
      reason
    });
    
    console.log("Updated log reason:", logId, reason);
    return true;
  } catch (error) {
    console.error("Error updating log reason:", error);
    return false;
  }
};
