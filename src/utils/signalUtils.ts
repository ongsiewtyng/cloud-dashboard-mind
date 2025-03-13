// Helper function to calculate time difference for duration display
export const getTimeDifference = (start: string, end: string): string => {
  const [startHours, startMinutes, startSeconds = "0"] = start.split(":").map(Number);
  const [endHours, endMinutes, endSeconds = "0"] = end.split(":").map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes + (startSeconds / 60);
  const endTotalMinutes = endHours * 60 + endMinutes + (endSeconds / 60);
  
  // Calculate the difference within the 8 AM - 5 PM window
  const totalMinutes = Math.max(0, endTotalMinutes - startTotalMinutes);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  
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
