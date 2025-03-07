
// Convert time string to minutes since start of day for position calculation
export const timeToMinutes = (timeStr: string) => {
  const [hours, minutes, seconds = '0'] = timeStr.split(':').map(Number);
  return hours * 60 + minutes + (seconds / 60);
};

// Format time label with AM/PM
export const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate normalized position based on time
export const calculateNormalizedPosition = (
  timestamp: string,
  startTime: string,
  endTime: string
) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalMinutes = endMinutes - startMinutes;
  const logMinutes = timeToMinutes(timestamp);
  
  return Math.max(0, Math.min(1, (logMinutes - startMinutes) / totalMinutes));
};

// Generate hourly time labels
export const generateHourlyLabels = (startTime: string, endTime: string) => {
  const labels = [];
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);

  for (let hour = startHour; hour <= endHour; hour++) {
    const timeStr = `${hour}:00`;
    const minutes = hour * 60;
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const [endH, endM] = endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const totalMinutes = endMinutes - startMinutes;
    const position = (minutes - startMinutes) / totalMinutes;

    if (position >= 0 && position <= 1) {
      labels.push({
        hour,
        position: position * 100,
        label: formatTimeLabel(timeStr)
      });
    }
  }
  return labels;
};
