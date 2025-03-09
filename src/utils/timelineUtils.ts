// Convert time string to minutes since start of day for position calculation
export const timeToMinutes = (timeStr: string) => {
  const [hours, minutes, seconds = '0'] = timeStr.split(':').map(Number);
  return hours * 60 + minutes + (Number(seconds) / 60);
};

// Format time label with AM/PM
export const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate normalized position based on time
export function calculateNormalizedPosition(
  time: string,
  startTime: string = "08:00",
  endTime: string = "17:00"
): number {
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const targetMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalDuration = endMinutes - startMinutes;

  const position = (targetMinutes - startMinutes) / totalDuration;
  return Math.max(0, Math.min(1, position)); // Clamp between 0 and 1
}

// Generate hourly time labels
export function generateHourlyLabels(startTime: string, endTime: string) {
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
    const hour = startHour + i;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const position = calculateNormalizedPosition(time, startTime, endTime) * 100;
    
    return {
      label: time,
      position
    };
  });
}
