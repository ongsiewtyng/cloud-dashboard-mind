import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { generateHourlyLabels, calculateNormalizedPosition } from "@/utils/timelineUtils";
import { Button } from "@/components/ui/button";
import { TimelineSignal } from "./TimelineSignal";

interface TimelineDataPoint {
    id: string;
    status: number;
    position: number;
    width: number;
    timestamp: string;
    endTimestamp?: string;
    duration?: string;
    reason: string;
    isActiveSignal?: boolean;
    extendToEnd?: boolean;
}

interface TimelineChartProps {
    timelineData: TimelineDataPoint[];
    startTime?: string;
    endTime?: string;
}

export function TimelineChart({
    timelineData,
    startTime = "08:00",
    endTime = "17:00"
}: TimelineChartProps) {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [startOffset, setStartOffset] = useState(0);
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isAutoCentering, setIsAutoCentering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const hourlyLabels = generateHourlyLabels(startTime, endTime);

    // Update current time position
    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const position = calculateNormalizedPosition(currentTime, startTime, endTime) * 100;
            setCurrentTimePosition(position);
        };

        updateCurrentTime();
        const interval = setInterval(updateCurrentTime, 60000);
        return () => clearInterval(interval);
    }, [startTime, endTime]);
    
    // Adjust tooltip position to stay in viewport
    useEffect(() => {
        if (hoveredSignal && tooltipRef.current) {
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let xPos = tooltipPosition.x + 10;
            let yPos = tooltipPosition.y - 80;
            
            // Adjust horizontal position if tooltip would overflow right edge
            if (xPos + tooltipRect.width > viewportWidth - 10) {
                xPos = tooltipPosition.x - tooltipRect.width - 10;
            }
            
            // Adjust vertical position if tooltip would overflow top edge
            if (yPos < 10) {
                yPos = tooltipPosition.y + 10;
            }
            
            // Adjust vertical position if tooltip would overflow bottom edge
            if (yPos + tooltipRect.height > viewportHeight - 10) {
                yPos = viewportHeight - tooltipRect.height - 10;
            }
            
            tooltipRef.current.style.left = `${xPos}px`;
            tooltipRef.current.style.top = `${yPos}px`;
        }
    }, [tooltipPosition, hoveredSignal]);

    // Function to center timeline at specified position with animation
    const centerAtPosition = useCallback((position: number, newZoom: number, animate = false) => {
        if (position < 0 || position > 100) return offset;
        
        const visibleWidth = 100 / newZoom;
        let newOffset = position - (visibleWidth / 2);
        newOffset = Math.max(0, Math.min(100 - visibleWidth, newOffset));
        
        if (animate) {
            setIsAutoCentering(true);
            // Use animation to smoothly transition to new offset
            const startPos = offset;
            const distance = newOffset - startPos;
            const startTime = performance.now();
            const duration = 300; // 300ms animation
            
            const animateScroll = (timestamp: number) => {
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic function for smooth deceleration
                const easeOutCubic = 1 - Math.pow(1 - progress, 3);
                const currentPos = startPos + (distance * easeOutCubic);
                
                setOffset(currentPos);
                
                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                } else {
                    setIsAutoCentering(false);
                }
            };
            
            requestAnimationFrame(animateScroll);
            return newOffset;
        } else {
            return newOffset;
        }
    }, [offset]);

    const handleZoomIn = useCallback(() => {
        const newZoom = Math.min(zoom * 1.5, 10);
        const newOffset = centerAtPosition(currentTimePosition, newZoom);
        setZoom(newZoom);
        setOffset(newOffset);
    }, [zoom, currentTimePosition, centerAtPosition]);

    const handleZoomOut = useCallback(() => {
        const newZoom = Math.max(zoom / 1.5, 1);
        if (newZoom === 1) {
            setOffset(0);
        } else {
            const newOffset = centerAtPosition(currentTimePosition, newZoom);
            setOffset(newOffset);
        }
        setZoom(newZoom);
    }, [zoom, currentTimePosition, centerAtPosition]);

    // Handle wheel events for zooming
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                handleZoomIn();
            } else {
                handleZoomOut();
            }
        }
    }, [handleZoomIn, handleZoomOut]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isAutoCentering) return;
        setIsDragging(true);
        setDragStart(e.clientX);
        setStartOffset(offset);
    }, [offset, isAutoCentering]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current || isAutoCentering) return;
        
        const dx = e.clientX - dragStart;
        const containerWidth = containerRef.current.clientWidth;
        const percentageMoved = (dx / containerWidth) * 100 * zoom;
        const maxOffset = Math.max(0, 100 - (100 / zoom));
        const newOffset = Math.max(0, Math.min(maxOffset, startOffset - percentageMoved));
        
        setOffset(newOffset);
    }, [isDragging, dragStart, zoom, startOffset, isAutoCentering]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const formatTime = useCallback((time: string) => {
        if (!time) return "";
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }, []);

    // Reset function
    const resetView = useCallback(() => {
        setZoom(1);
        setOffset(0);
    }, []);

    // Click handler to center on specific point
    const handleTimelineClick = useCallback((e: React.MouseEvent) => {
        if (isDragging || !containerRef.current || isAutoCentering) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPositionPercent = ((e.clientX - rect.left) / rect.width) * 100;
        
        // Calculate the actual position in the timeline, accounting for current zoom and offset
        const actualPosition = (clickPositionPercent / 100) * (100 / zoom) + offset;
        
        // Center on this position if zoom level > 1
        if (zoom > 1) {
            centerAtPosition(actualPosition, zoom, true);
        }
    }, [zoom, offset, isDragging, centerAtPosition, isAutoCentering]);

    // Custom tooltip handlers
    const handleSignalMouseEnter = useCallback((e: React.MouseEvent, signal: TimelineDataPoint) => {
        setHoveredSignal(signal.id);
        setTooltipPosition({ 
            x: e.clientX, 
            y: e.clientY - 10 // Position slightly above cursor
        });
        
        // Auto-center on the signal if zoom level > 1
        if (zoom > 1) {
            // Calculate the center position of the signal
            const signalCenter = signal.position + (signal.width / 2);
            centerAtPosition(signalCenter, zoom, true);
        }
    }, [zoom, centerAtPosition]);

    const handleSignalMouseMove = useCallback((e: React.MouseEvent) => {
        setTooltipPosition({ 
            x: e.clientX, 
            y: e.clientY - 10 
        });
    }, []);

    const handleSignalMouseLeave = useCallback(() => {
        setHoveredSignal(null);
    }, []);

    // Find the hovered signal data
    const hoveredSignalData = hoveredSignal 
        ? timelineData.find(signal => signal.id === hoveredSignal) 
        : null;

    return (
        <div 
            className="relative w-full h-40 bg-white rounded-lg border border-slate-200 overflow-hidden"
            ref={containerRef}
            onWheel={handleWheel}
        >
            {/* Controls header */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 z-30">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Timeline</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 relative group"
                        onClick={handleZoomOut}
                        disabled={zoom === 1}
                    >
                        <ZoomOut className="h-4 w-4" />
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Zoom Out
                        </span>
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 relative group"
                        onClick={handleZoomIn}
                        disabled={zoom >= 10}
                    >
                        <ZoomIn className="h-4 w-4" />
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Zoom In
                        </span>
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 relative group"
                        onClick={resetView}
                        disabled={zoom === 1 && offset === 0}
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Reset View
                        </span>
                    </Button>
                </div>
            </div>

            {/* Time labels at top */}
            <div 
                className="absolute top-10 left-0 right-0 h-6 bg-slate-50 border-b border-slate-200 z-20"
                style={{
                    width: `${zoom * 100}%`,
                    transform: `translateX(-${offset}%)`,
                    transition: isAutoCentering ? 'transform 0.3s ease-out' : 'none'
                }}
            >
                {hourlyLabels.map((label, i) => (
                    <div
                        key={i}
                        className="absolute text-xs text-slate-500"
                        style={{ 
                            left: `${label.position}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {formatTime(label.label)}
                    </div>
                ))}
            </div>

            {/* Timeline container */}
            <div 
                className="absolute top-16 left-0 right-0 bottom-0 px-4"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    handleMouseUp();
                    handleSignalMouseLeave();
                }}
                onClick={handleTimelineClick}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <div 
                    className="relative h-full"
                    style={{
                        width: `${zoom * 100}%`,
                        transform: `translateX(-${offset}%)`,
                        transition: isAutoCentering ? 'transform 0.3s ease-out' : 'none'
                    }}
                >
                    {/* Hour lines */}
                    {hourlyLabels.map((label, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 w-px bg-slate-200"
                            style={{ left: `${label.position}%` }}
                        />
                    ))}

                    {/* Current time indicator */}
                    {currentTimePosition >= 0 && currentTimePosition <= 100 && (
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-blue-500 z-20"
                            style={{ left: `${currentTimePosition}%` }}
                        >
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs py-1 px-2 rounded">
                                Now
                            </div>
                        </div>
                    )}

                    {/* Signal bars */}
                    {timelineData.map(signal => (
                        <TimelineSignal
                            key={signal.id}
                            id={signal.id}
                            position={signal.position}
                            width={signal.width}
                            status={signal.status}
                            timestamp={signal.timestamp}
                            endTimestamp={signal.endTimestamp}
                            duration={signal.duration}
                            reason={signal.reason}
                            isSelected={hoveredSignal === signal.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSignalMouseEnter(e, signal);
                            }}
                            isActiveSignal={signal.isActiveSignal}
                            extendToEnd={signal.extendToEnd}
                        />
                    ))}
                </div>
            </div>
            
            {/* Zoom indicator */}
            {zoom > 1 && (
                <div className="absolute bottom-2 right-2 bg-slate-800 text-white text-xs py-1 px-2 rounded-full opacity-70 z-30">
                    {zoom.toFixed(1)}x
                </div>
            )}

            {/* Custom tooltip - now uses adaptive width and repositioning */}
            {hoveredSignal && hoveredSignalData && (
                <div 
                    ref={tooltipRef}
                    className="fixed bg-white shadow-lg rounded-md border border-slate-200 p-2 z-50 max-w-xs"
                    style={{
                        position: 'fixed',
                        // Initial position - will be adjusted by useEffect
                        left: `${tooltipPosition.x + 10}px`,
                        top: `${tooltipPosition.y - 80}px`,
                    }}
                >
                    <div className={`font-medium mb-1 border-b pb-1 ${
                        hoveredSignalData.status === 1 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {hoveredSignalData.status === 1 ? 'Running' : 'Down'}
                    </div>
                    <div className="flex flex-col space-y-1 text-xs">
                        <div className="flex">
                            <span className="text-slate-400 mr-2 font-medium">Time:</span>
                            {formatTime(hoveredSignalData.timestamp)}
                            {hoveredSignalData.endTimestamp && ` - ${formatTime(hoveredSignalData.endTimestamp)}`}
                        </div>
                        {hoveredSignalData.duration && (
                            <div className="flex">
                                <span className="text-slate-400 mr-2 font-medium">Duration:</span>
                                {hoveredSignalData.duration}
                            </div>
                        )}
                        {hoveredSignalData.status === 0 && hoveredSignalData.reason && (
                            <div className="flex flex-col">
                                <span className="text-slate-400 mr-2 font-medium">Reason:</span>
                                <span className="text-slate-700 mt-1 break-words">{hoveredSignalData.reason}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}