
import {useState, useRef, useEffect} from "react";
import {Clock} from "lucide-react";
import {TimelineControls} from "./TimelineControls";
import {TimelineSignal} from "./TimelineSignal";
import {TimelineDetails} from "./TimelineDetails";
import {TimeLabels} from "./TimeLabels";
import {TimeIndicator} from "./TimeIndicator";
import * as React from "react";

interface TimelineChartProps {
    timelineData: Array<{
        id: string;
        status: number;
        position: number;
        timestamp: string;
        reason: string;
    }>;
}

export function TimelineChart({timelineData}: TimelineChartProps) {
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
    const currentPanRef = useRef(panOffset);

    // Update ref when panOffset changes
    useEffect(() => {
        currentPanRef.current = panOffset;
    }, [panOffset]);

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

            // Calculate normalized position (0-1)
            const position = Math.max(0, Math.min(1, (currentMinutes - startMinutes) / totalMinutes));
            setCurrentTimePosition(position);

            // Auto-pan to follow current time if not dragging
            if (!isDragging && timelineRef.current) {
                // Calculate center position for timeline
                const newOffset = (position * 100 * zoomLevel) -
                    (timelineRef.current.clientWidth / 2);

                // Calculate maximum possible offset
                const maxPan = Math.max(0, (100 * zoomLevel) - timelineRef.current.clientWidth);

                // Set pan offset, ensuring it stays within bounds
                setPanOffset(Math.max(0, Math.min(newOffset, maxPan)));
            }
        };

        updateCurrentTime(); // Initial update
        const interval = setInterval(updateCurrentTime, 1000);
        return () => clearInterval(interval);
    }, [zoomLevel, isDragging, startTime, endTime]);

    const handleZoomIn = () => {
        setZoomLevel(prev => {
            // Limit max zoom to 4x to prevent bugs
            const newZoom = Math.min(prev + 0.5, 4);

            // Center zoom on current time position
            if (timelineRef.current) {
                const timelineWidth = timelineRef.current.clientWidth;
                const centerOnCurrentTime = (currentTimePosition * 100 * newZoom) - (timelineWidth / 2);
                
                // Ensure offset is within bounds
                const maxPan = Math.max(0, (100 * newZoom) - timelineWidth);
                setPanOffset(Math.max(0, Math.min(centerOnCurrentTime, maxPan)));
            }

            return newZoom;
        });
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => {
            if (prev <= 1) return 1;

            const newZoom = Math.max(prev - 0.5, 1);
            
            // Center zoom on current time position when zooming out
            if (timelineRef.current) {
                const timelineWidth = timelineRef.current.clientWidth;
                const centerOnCurrentTime = (currentTimePosition * 100 * newZoom) - (timelineWidth / 2);
                
                // Ensure offset is within bounds
                const maxPan = Math.max(0, (100 * newZoom) - timelineWidth);
                setPanOffset(Math.max(0, Math.min(centerOnCurrentTime, maxPan)));
            }

            return newZoom;
        });
    };

    const handleReset = () => {
        setZoomLevel(1.5);

        // Reset pan to center on current time
        if (timelineRef.current) {
            // Calculate center on current time
            const centerOnCurrentTime = (currentTimePosition * 100 * 1.5) -
                (timelineRef.current.clientWidth / 2);

            // Ensure offset is within bounds
            const maxPan = Math.max(0, (100 * 1.5) - timelineRef.current.clientWidth);
            setPanOffset(Math.max(0, Math.min(centerOnCurrentTime, maxPan)));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart(e.clientX);
            // Prevent text selection during drag
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && timelineRef.current) {
            const deltaX = dragStart - e.clientX;
            
            // Using the current value from ref to avoid closure issues
            const currentOffset = currentPanRef.current;
            const maxPan = Math.max(0, (100 * zoomLevel) - timelineRef.current.clientWidth);
            const newPanOffset = Math.max(0, Math.min(currentOffset + deltaX, maxPan));

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

    const handleSignalClick = (signalData: typeof timelineData[0], e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedSignalDetails(signalData);
    };

    const formatTimeLabel = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Generate hourly time labels
    const generateHourlyLabels = () => {
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

    const hourlyLabels = generateHourlyLabels();

    return (
        <div className="mb-6 bg-slate-100 p-4 rounded-lg shadow-sm" onClick={() => setSelectedSignalDetails(null)}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500"/>
                    <span>Machine Status Timeline</span>
                </h3>
                <TimelineControls
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onReset={handleReset}
                />
            </div>

            <div className="relative h-32 bg-white border border-slate-200 rounded-md shadow-inner overflow-hidden">
                {/* Time indicators */}
                <div
                    className="absolute top-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-3 py-1 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1"/>
                        <span>{formatTimeLabel(startTime)}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1"/>
                        <span>{formatTimeLabel(endTime)}</span>
                    </div>
                </div>

                {/* Interactive timeline area */}
                <div
                    ref={timelineRef}
                    className="absolute top-8 left-0 right-0 bottom-0 overflow-hidden"
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Hourly time labels */}
                    <TimeLabels 
                        hourlyLabels={hourlyLabels} 
                        panOffset={panOffset} 
                        zoomLevel={zoomLevel} 
                    />

                    {/* Timeline container with zoom and pan */}
                    <div
                        className="absolute top-8 left-0 h-full transition-transform"
                        style={{
                            width: `${100 * zoomLevel}%`,
                            transform: `translateX(-${panOffset}px)`,
                        }}
                    >
                        {/* Signal events */}
                        {timelineData.map((data) => (
                            <TimelineSignal
                                key={data.id}
                                id={data.id}
                                position={data.position}
                                status={data.status}
                                timestamp={data.timestamp}
                                reason={data.reason}
                                isSelected={selectedSignalDetails?.id === data.id}
                                onClick={(e) => handleSignalClick(data, e)}
                            />
                        ))}
                    </div>

                    {/* Current time indicator */}
                    <TimeIndicator 
                        position={currentTimePosition} 
                        panOffset={panOffset} 
                        zoomLevel={zoomLevel} 
                    />
                </div>

                {/* Legend */}
                {/*<div*/}
                {/*    className="absolute bottom-1 right-2 flex items-center gap-4 text-xs bg-white/80 px-2 py-0.5 rounded">*/}
                {/*    <div className="flex items-center">*/}
                {/*        <div className="h-2.5 w-2.5 bg-green-500 rounded-full mr-1.5"/>*/}
                {/*        <span>Running</span>*/}
                {/*    </div>*/}
                {/*    <div className="flex items-center">*/}
                {/*        <div className="h-2.5 w-2.5 bg-red-500 rounded-full mr-1.5"/>*/}
                {/*        <span>Stopped</span>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>

            {/* Selected signal details panel */}
            <TimelineDetails selectedSignal={selectedSignalDetails} />

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
