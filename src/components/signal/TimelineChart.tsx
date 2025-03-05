import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { TimelineControls } from "./TimelineControls";

interface TimelineChartProps {
  timelineData: Array<{
    id: string;
    status: number;
    position: number;
    timestamp: string;
    reason: string;
  }>;
}

export function TimelineChart({ timelineData }: TimelineChartProps) {
  const startTime = "08:00";
  const endTime = "17:00";
  
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [selectedSignalDetails, setSelectedSignalDetails] = useState<{
    id: string;
    status: number;
    timestamp: string;
    reason: string;
  } | null>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Update current time position every second
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };
      
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const currentMinutes = hours * 60 + minutes;
      const totalMinutes = endMinutes - startMinutes;
      
      const position = Math.max(0, Math.min(1, (currentMinutes - startMinutes) / totalMinutes));
      setCurrentTimePosition(position);
      
      // Auto-pan to follow current time if not dragging
      if (!isDragging && timelineRef.current) {
        const newOffset = (position * timelineRef.current.scrollWidth * zoomLevel) - 
                         (timelineRef.current.clientWidth / 2);
        setPanOffset(Math.max(0, Math.min(newOffset, 
          (timelineRef.current.scrollWidth * zoomLevel) - timelineRef.current.clientWidth)));
      }
    };
    
    updateCurrentTime(); // Initial update
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, [zoomLevel, isDragging]);
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.5, 5));
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(Math.max(zoomLevel - 0.5, 1));
      // Adjust pan offset when zooming out to prevent overflow
      if (timelineRef.current) {
        const maxPan = (timelineRef.current.scrollWidth * zoomLevel) - timelineRef.current.clientWidth;
        setPanOffset(Math.max(Math.min(panOffset, maxPan), 0));
      }
    }
  };
  
  const handleReset = () => {
    setZoomLevel(1.5);
    
    // Reset pan to center on current time
    if (timelineRef.current) {
      const currentTimePosition = getCurrentTimePosition();
      const initialOffset = (currentTimePosition * timelineRef.current.scrollWidth * 1.5) - 
                            (timelineRef.current.clientWidth / 2);
      
      // Ensure offset is within bounds
      const maxPan = (timelineRef.current.scrollWidth * 1.5) - timelineRef.current.clientWidth;
      setPanOffset(Math.max(0, Math.min(initialOffset, maxPan)));
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart(e.clientX);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && timelineRef.current) {
      const deltaX = dragStart - e.clientX;
      const maxPan = (timelineRef.current.scrollWidth * zoomLevel) - timelineRef.current.clientWidth;
      const newPanOffset = Math.max(Math.min(panOffset + deltaX, maxPan), 0);
      
      setPanOffset(newPanOffset);
      setDragStart(e.clientX);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Convert to minutes since start of day for position calculation
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Calculate position as percentage of total workday
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const currentMinutes = timeToMinutes(currentTime);
    const totalMinutes = endMinutes - startMinutes;
    
    // Calculate normalized position (0-1)
    return Math.max(0, Math.min(1, (currentMinutes - startMinutes) / totalMinutes));
  };
  
  const handleSignalClick = (signalData: typeof timelineData[0]) => {
    setSelectedSignalDetails(signalData);
  };
  
  const formatTimeLabel = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <div className="mb-6 bg-slate-100 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span>Machine Status Timeline</span>
        </h3>
        <TimelineControls 
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
        />
      </div>
      
      <div className="relative h-28 bg-white border border-slate-200 rounded-md shadow-inner overflow-hidden">
        {/* Time indicators */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-3 py-1 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatTimeLabel(startTime)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatTimeLabel(endTime)}</span>
          </div>
        </div>
        
        {/* Current time indicator */}
        <div 
          className="absolute top-8 bottom-0 w-0.5 bg-blue-500 z-20 transition-transform duration-1000"
          style={{ 
            left: `${currentTimePosition * 100}%`,
            transform: `translateX(-${panOffset * (1/zoomLevel)}px)`,
          }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
        
        {/* Interactive timeline area */}
        <div 
          ref={timelineRef}
          className="absolute top-8 left-0 right-0 bottom-0 cursor-grab overflow-hidden" 
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Scale markers */}
          <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={`marker-${i}`} 
                className="absolute top-0 bottom-0 border-l border-slate-300" 
                style={{ 
                  left: `${i * 10}%`,
                  transform: `translateX(-${panOffset * (1/zoomLevel)}px)`,
                }}
              />
            ))}
          </div>
          
          {/* Timeline container with zoom and pan */}
          <div 
            className="absolute top-6 left-0 h-full transition-transform" 
            style={{ 
              width: `${100 * zoomLevel}%`,
              transform: `translateX(-${panOffset}px)`,
            }}
          >
            {/* Signal events */}
            {timelineData.map((data) => {
              const isSelected = selectedSignalDetails?.id === data.id;
              return (
                <div 
                  key={data.id}
                  className={`absolute top-0 bottom-0 cursor-pointer transition-all
                           ${isSelected ? 'z-10' : 'z-0'}`}
                  style={{ 
                    left: `${data.position}%`,
                    width: isSelected ? '6px' : '4px',
                    marginLeft: isSelected ? '-3px' : '-2px',
                    backgroundColor: data.status === 1 ? '#22c55e' : '#ef4444',
                    boxShadow: isSelected 
                      ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(0,0,0,0.1)' 
                      : '0 0 0 1px rgba(255,255,255,0.7)',
                  }}
                  onClick={() => handleSignalClick(data)}
                />
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-1 right-2 flex items-center gap-4 text-xs bg-white/80 px-2 py-0.5 rounded">
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 bg-green-500 rounded-full mr-1.5" />
            <span>Running</span>
          </div>
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 bg-red-500 rounded-full mr-1.5" />
            <span>Stopped</span>
          </div>
        </div>
      </div>
      
      {/* Selected signal details panel */}
      {selectedSignalDetails && (
        <div className="mt-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Signal Details</h4>
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ 
                backgroundColor: selectedSignalDetails.status === 1 ? '#22c55e' : '#ef4444' 
              }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium">
                {selectedSignalDetails.status === 1 ? "Running" : "Stopped"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Time:</span>{" "}
              <span className="font-medium">{selectedSignalDetails.timestamp}</span>
            </div>
            {selectedSignalDetails.reason && (
              <div className="col-span-2">
                <span className="text-slate-500">Reason:</span>{" "}
                <span className="font-medium capitalize">{selectedSignalDetails.reason}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground">
        {zoomLevel > 1 ? (
          <span>Drag to pan • Click signal bar for details • Zoom: {zoomLevel.toFixed(1)}x</span>
        ) : (
          <span>Click signal bar for details • Use zoom controls for a closer view</span>
        )}
      </div>
    </div>
  );
}
