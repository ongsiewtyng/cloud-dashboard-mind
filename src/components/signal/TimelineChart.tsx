import {useState, useRef, useEffect} from "react";
import {Clock} from "lucide-react";
import {TimelineControls} from "./TimelineControls";
import {TimelineSignal} from "./TimelineSignal";
import {TimelineDetails} from "./TimelineDetails";
import {TimeLabels} from "./TimeLabels";
import {TimeIndicator} from "./TimeIndicator";
import {generateHourlyLabels, formatTimeLabel} from "@/utils/timelineUtils";
import * as React from "react";

interface TimelineChartProps {
    timelineData: Array<{
        id: string;
        status: number;
        position: number;
        width: number;
        timestamp: string;
        endTimestamp?: string;
        duration?: string;
        reason: string;
    }>;
}

export function TimelineChart({timelineData}: TimelineChartProps) {
    const startTime = "08:00";
    const endTime = "17:00";

    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [selectedSignalDetails, setSelectedSignalDetails] = useState<{
        id: string;
        status: number;
        timestamp: string;
        endTimestamp?: string;
        duration?: string;
        reason: string;
    } | null>(null);
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [shouldFollowTime, setShouldFollowTime] = useState(true);
    const [activeSignalId, setActiveSignalId] = useState<string | null>(null);

    const timelineRef = useRef<HTMLDivElement>(null);
    const currentPanRef = useRef(panOffset);
    const containerWidthRef = useRef(0);

    useEffect(() => {
        currentPanRef.current = panOffset;
    }, [panOffset]);

    useEffect(() => {
        if (timelineRef.current) {
            containerWidthRef.current = timelineRef.current.clientWidth;
            
            if (shouldFollowTime) {
                centerOnCurrentTime(zoomLevel);
            }
        }
        
        const handleResize = () => {
            if (timelineRef.current) {
                containerWidthRef.current = timelineRef.current.clientWidth;
                
                if (shouldFollowTime) {
                    centerOnCurrentTime(zoomLevel);
                } else {
                    const maxPan = Math.max(0, (containerWidthRef.current * zoomLevel) - containerWidthRef.current);
                    setPanOffset(prev => Math.max(0, Math.min(prev, maxPan)));
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [zoomLevel, shouldFollowTime]);

    useEffect(() => {
        if (timelineData.length > 0) {
            const activeSignal = timelineData.find(signal => 
                signal.status === 1 && !signal.endTimestamp
            );
            
            if (activeSignal) {
                setActiveSignalId(activeSignal.id);
            } else {
                setActiveSignalId(null);
            }
        }
    }, [timelineData]);

    const centerOnCurrentTime = (zoom: number) => {
        if (!timelineRef.current) return;
        
        const timelineWidth = containerWidthRef.current;
        const centerPosition = (currentTimePosition * timelineWidth * zoom) - (timelineWidth / 2);
        
        const maxPan = Math.max(0, (timelineWidth * zoom) - timelineWidth);
        const newOffset = Math.max(0, Math.min(centerPosition, maxPan));
        
        setPanOffset(newOffset);
    };

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

            if (shouldFollowTime && !isDragging && timelineRef.current) {
                centerOnCurrentTime(zoomLevel);
            }
        };

        updateCurrentTime();
        const interval = setInterval(updateCurrentTime, 1000);
        return () => clearInterval(interval);
    }, [zoomLevel, isDragging, startTime, endTime, shouldFollowTime]);

    const handleZoomIn = () => {
        setZoomLevel(prev => {
            const newZoom = Math.min(prev + 0.25, 3);
            
            if (timelineRef.current) {
                if (shouldFollowTime) {
                    centerOnCurrentTime(newZoom);
                } else {
                    const viewportCenter = panOffset + (containerWidthRef.current / 2);
                    const normalizedCenter = viewportCenter / (containerWidthRef.current * prev);
                    const newCenterOffset = normalizedCenter * (containerWidthRef.current * newZoom);
                    const newPanOffset = newCenterOffset - (containerWidthRef.current / 2);
                    
                    const maxPan = Math.max(0, (containerWidthRef.current * newZoom) - containerWidthRef.current);
                    setPanOffset(Math.max(0, Math.min(newPanOffset, maxPan)));
                }
            }
            
            return newZoom;
        });
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => {
            if (prev <= 1) return 1;
            
            const newZoom = Math.max(prev - 0.25, 1);
            
            if (timelineRef.current) {
                if (shouldFollowTime) {
                    centerOnCurrentTime(newZoom);
                } else {
                    const viewportCenter = panOffset + (containerWidthRef.current / 2);
                    const normalizedCenter = viewportCenter / (containerWidthRef.current * prev);
                    const newCenterOffset = normalizedCenter * (containerWidthRef.current * newZoom);
                    const newPanOffset = newCenterOffset - (containerWidthRef.current / 2);
                    
                    const maxPan = Math.max(0, (containerWidthRef.current * newZoom) - containerWidthRef.current);
                    setPanOffset(Math.max(0, Math.min(newPanOffset, maxPan)));
                }
            }
            
            return newZoom;
        });
    };

    const handleReset = () => {
        setZoomLevel(1);
        setShouldFollowTime(true);
        
        centerOnCurrentTime(1);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart(e.clientX);
            setShouldFollowTime(false);
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && timelineRef.current) {
            const deltaX = dragStart - e.clientX;
            
            const timelineWidth = containerWidthRef.current;
            const maxPan = Math.max(0, (timelineWidth * zoomLevel) - timelineWidth);
            
            const newPanOffset = Math.max(0, Math.min(currentPanRef.current + deltaX, maxPan));
            
            setPanOffset(newPanOffset);
            setDragStart(e.clientX);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = 'auto';
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = 'auto';
        }
    };

    const handleSignalClick = (signalData: typeof timelineData[0], e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedSignalDetails(signalData);
    };

    const hourlyLabels = generateHourlyLabels(startTime, endTime);

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

                <div
                    ref={timelineRef}
                    className="absolute top-8 left-0 right-0 bottom-0 overflow-hidden"
                    style={{
                        cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        className="absolute top-4 left-0 h-full w-full"
                        style={{
                            width: `${100 * zoomLevel}%`,
                            transform: `translateX(-${panOffset}px)`,
                        }}
                    >
                        <TimeLabels 
                            hourlyLabels={hourlyLabels} 
                            panOffset={panOffset} 
                            zoomLevel={zoomLevel} 
                        />

                        {timelineData.map((data) => (
                            <TimelineSignal
                                key={data.id}
                                id={data.id}
                                position={data.position}
                                width={data.width}
                                status={data.status}
                                timestamp={data.timestamp}
                                endTimestamp={data.endTimestamp}
                                duration={data.duration}
                                reason={data.reason}
                                isSelected={selectedSignalDetails?.id === data.id}
                                isActiveSignal={data.id === activeSignalId}
                                onClick={(e) => handleSignalClick(data, e)}
                            />
                        ))}
                    </div>

                    <TimeIndicator 
                        position={currentTimePosition} 
                        panOffset={panOffset} 
                        zoomLevel={zoomLevel} 
                    />
                </div>
            </div>

            <TimelineDetails selectedSignal={selectedSignalDetails} />

            <div className="mt-2 text-xs text-muted-foreground">
                {zoomLevel > 1 ? (
                    <span>Drag to pan • Click signal bar for details • Zoom: {zoomLevel.toFixed(1)}x {shouldFollowTime ? '• Following current time' : ''}</span>
                ) : (
                    <span>Click signal bar for details • Use zoom controls for a closer view</span>
                )}
            </div>
        </div>
    );
}
