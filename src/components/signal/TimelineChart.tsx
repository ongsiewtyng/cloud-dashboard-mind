import React from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle } from "lucide-react";
import { generateHourlyLabels } from "@/utils/timelineUtils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { calculateNormalizedPosition } from "@/utils/timelineUtils";


interface TimelineDataPoint {
    id: string;
    status: number;
    position: number;
    width: number;
    timestamp: string;
    endTimestamp?: string;
    duration?: string;
    reason: string;
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
    const hourlyLabels = generateHourlyLabels(startTime, endTime);

    // Function to format time for tooltip display
    const formatTime = (time: string) => {
        const [hours, minutes, seconds] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="relative w-full h-40 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
            {/* Timeline header with current time indicator */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-white border-b border-slate-200 flex items-center px-4">
                <Clock className="h-4 w-4 text-slate-500 mr-2" />
                <span className="text-sm font-medium text-slate-700">Timeline (Today)</span>
            </div>

            {/* Time labels */}
            <div className="absolute top-8 left-0 right-0 h-6 flex">
                {hourlyLabels.map((label, i) => (
                    <div
                        key={i}
                        className="absolute h-full flex flex-col items-center"
                        style={{ left: `${label.position}%` }}
                    >
                        <div className="h-2 w-px bg-slate-300"></div>
                        <span className="text-xs text-slate-500 mt-1">{label.label}</span>
                    </div>
                ))}
            </div>

            {/* Timeline content */}
            <div className="absolute top-16 left-0 right-0 bottom-0 p-4">
                <div className="relative w-full h-full">
                    {/* Background grid */}
                    <div className="absolute inset-0">
                        {hourlyLabels.map((label, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 w-px bg-slate-200"
                                style={{ left: `${label.position}%` }}
                            ></div>
                        ))}
                    </div>

                    {/* Signal bars */}
                    {timelineData.map((signal) => (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`absolute h-8 rounded-md ${
                                        signal.status === 1 ? 'bg-green-500' : 'bg-red-500 flex items-center justify-center'
                                    }`}
                                    style={{
                                        left: `${signal.position}%`,
                                        width: `${signal.width}%`,
                                        transformOrigin: 'left',
                                        minWidth: '10px'
                                    }}
                                >
                                    {signal.status === 0 && signal.width > 3 && (
                                        <AlertCircle className="h-4 w-4 text-white" />
                                    )}
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent className="py-2 px-3 bg-slate-800 text-white text-xs rounded-md max-w-xs">
                                <div className="font-medium mb-1">
                                    {signal.status === 1 ? 'Running' : 'Down'}
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <div className="flex">
                                        <span className="text-slate-300 mr-2">Start:</span>
                                        {formatTime(signal.timestamp)}
                                    </div>
                                    {signal.endTimestamp && (
                                        <div className="flex">
                                            <span className="text-slate-300 mr-2">End:</span>
                                            {formatTime(signal.endTimestamp)}
                                        </div>
                                    )}
                                    {signal.duration && (
                                        <div className="flex">
                                            <span className="text-slate-300 mr-2">Duration:</span>
                                            {signal.duration}
                                        </div>
                                    )}
                                    {signal.status === 0 && signal.reason && (
                                        <div className="flex">
                                            <span className="text-slate-300 mr-2">Reason:</span>
                                            {signal.reason}
                                        </div>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    ))}

                    {/* Current time indicator */}
                    <CurrentTimeIndicator startTime={startTime} endTime={endTime} />
                </div>
            </div>
        </div>
    );
}

// Current time indicator that updates every minute
function CurrentTimeIndicator({ startTime, endTime }: { startTime: string, endTime: string }) {
    const [position, setPosition] = React.useState(0);

    React.useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const currentTime = `${hours}:${minutes}:${seconds}`;

            const pos = calculateNormalizedPosition(currentTime, startTime, endTime) * 100;
            setPosition(pos);
        };

        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    if (position < 0 || position > 100) return null;

    return (
        <div
            className="absolute top-0 bottom-0 w-px bg-indigo-600 z-10"
            style={{ left: `${position}%` }}
        >
            <div className="absolute -top-1 -translate-x-1/2 bg-indigo-600 text-white text-xs px-1 rounded">
                Now
            </div>
        </div>
    );
}
