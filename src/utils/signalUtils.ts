// Helper function to calculate time difference for duration display
export const getTimeDifference = (start: string, end: string): string => {
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  // If end time is before start time, assume it's within the same day (8 AM - 5 PM window)
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add a full day of minutes
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Format current time as HH:MM:SS string
export const getCurrentTimeString = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Generate random downtime reason
export const getRandomDowntimeReason = (): string => {
  const reasons = ["maintenance", "breakdown", "setup", "material", "operator", "quality", "planned", "other"];
  return reasons[Math.floor(Math.random() * reasons.length)];
};
