import {ref, push, get, set, query, orderByChild, equalTo, onValue, getDatabase} from "firebase/database";
import { db } from "@/lib/firebase";
import { getTimeDifference, getCurrentTimeString } from "@/utils/signalUtils";

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
console.log(signalLogsRef);

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

    // Find previous log to calculate endTimestamp and duration
    const previousLog = await getLatestLogForMachine(machineId);
    let endTimestamp;
    let duration;

    // Create new log entry
    const newLogRef = push(ref(db, `signalLogs/${machineId}`));
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
    if (previousLog && previousLog.status !== status) {
      await updateLogEndTimeAndDuration(previousLog, timestamp);
    }

    return newLog;
  } catch (error) {
    console.error("Error adding signal log:", error);
    return null;
  }
};

// Update a specific log with end time and duration
export const updateLogEndTimeAndDuration = async (
    log: SignalLog,
    endTimeStamp: string
): Promise<boolean> => {
  try {
    if (!log.id) return false;

    // Calculate duration
    const duration = getTimeDifference(log.timestamp, endTimeStamp);

    // Update the log
    const logRef = ref(db, `signalLogs/${log.machineId}/${log.id}`);
    await set(logRef, {
      ...log,
      endTimestamp: endTimeStamp,
      duration
    });

    console.log("Updated log with end time and duration:", log.id);
    return true;
  } catch (error) {
    console.error("Error updating log end time and duration:", error);
    return false;
  }
};

// Get the latest log for a specific machine
export const getLatestLogForMachine = async (machineId: string): Promise<SignalLog | null> => {
  try {
    // Create a query to get logs for this machine
    const machineLogsRef = ref(db, `signalLogs/${machineId}`);
    const snapshot = await get(machineLogsRef);

    if (!snapshot.exists()) return null;

    let latestLog: SignalLog | null = null;
    let latestTime = 0;

    // Find the most recent log
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val() as SignalLog;

      // Convert timestamp to a comparable number
      const logTime = new Date(`1970-01-01T${log.timestamp}Z`).getTime();

      if (!latestLog || logTime > latestTime) {
        latestLog = {
          ...log,
          id: childSnapshot.key as string
        };
        latestTime = logTime;
      }
    });

    return latestLog;
  } catch (error) {
    console.error("Error getting latest log for machine:", error);
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
    const recentLogsQuery = ref(db, `signalLogs/${machineId}`);

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

// Get logs for a specific machine and date
export async function getSignalLogs(machineID: string) {
  const db = getDatabase();
  const logsRef = ref(db, `signalLogs/${machineID}`); // Get logs for specific machine

  try {
    const snapshot = await get(logsRef);
    if (snapshot.exists()) {
      const data = snapshot.val(); // Get raw data
      const logsArray = Object.values(data); // Convert to an array
      console.log("Fetched Logs:", logsArray); // Log result
      return logsArray;
    } else {
      console.log("No logs available for this machine.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching signal logs:", error);
    return [];
  }
}


// Listen for logs for a specific machine in real-time
export const subscribeToSignalLogs = (
    machineId: string,
    callback: (logs: SignalLog[]) => void
) => {
  // Create a reference to the machine's logs node
  const machineLogsRef = ref(db, `signalLogs/${machineId}`);

  // Set up a real-time listener
  const unsubscribe = onValue(machineLogsRef, (snapshot) => {
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
export const updateSignalLogReason = async (logId: string, reason: string, machineId: string): Promise<boolean> => {
  try {
    const logRef = ref(db, `signalLogs/${machineId}/${logId}`);
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

// Update durations of all logs for a specific machine
export const updateAllLogDurations = async (machineId: string): Promise<boolean> => {
  try {
    const machineLogsRef = ref(db, `signalLogs/${machineId}`);
    const snapshot = await get(machineLogsRef);

    if (!snapshot.exists()) return false;

    // Get all logs and sort by timestamp
    const logs: SignalLog[] = [];
    snapshot.forEach((childSnapshot) => {
      logs.push({
        ...childSnapshot.val(),
        id: childSnapshot.key as string
      });
    });

    // Sort by timestamp (oldest first)
    logs.sort((a, b) => {
      const aTime = new Date(`1970-01-01T${a.timestamp}Z`).getTime();
      const bTime = new Date(`1970-01-01T${b.timestamp}Z`).getTime();
      return aTime - bTime;
    });

    // Update each log's duration based on the next log's timestamp
    for (let i = 0; i < logs.length - 1; i++) {
      const currentLog = logs[i];
      const nextLog = logs[i + 1];

      // If status is different, update the current log's end time and duration
      if (currentLog.status !== nextLog.status) {
        await updateLogEndTimeAndDuration(currentLog, nextLog.timestamp);
      }
    }

    // For the last log, if it's still ongoing, set end time to current time
    const lastLog = logs[logs.length - 1];
    if (!lastLog.endTimestamp) {
      const currentTime = getCurrentTimeString();
      await updateLogEndTimeAndDuration(lastLog, currentTime);
    }

    return true;
  } catch (error) {
    console.error("Error updating all log durations:", error);
    return false;
  }
};