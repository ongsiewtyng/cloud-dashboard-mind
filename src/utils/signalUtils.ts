
// Helper function to calculate time difference for duration display
export const getTimeDifference = (start: string, end: string): string => {
  const startDate = new Date(`1970-01-01T${start}Z`);
  const endDate = new Date(`1970-01-01T${end}Z`);
  
  // If end time is before start time, assume it's the next day
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  
  if (diffHours > 0) {
    return `${diffHours}h ${remainingMins}m`;
  } else {
    return `${remainingMins}m`;
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
