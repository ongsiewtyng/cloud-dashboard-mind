
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArduinoData } from "@/lib/arduino-service";

interface ArduinoDataChartProps {
  data: ArduinoData[];
}

export function ArduinoDataChart({ data }: ArduinoDataChartProps) {
  // Format data for chart
  const chartData = useMemo(() => {
    return data.map(d => ({
      timestamp: new Date(parseInt(d.timestamp)).toLocaleTimeString(),
      state: d.machineState === "True" ? 1 : 0,
      runtime: parseInt(d.runTime)
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 border rounded-md bg-slate-50">
        <p className="text-muted-foreground text-sm">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 11 }} 
            tickMargin={8}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#8884d8" 
            domain={[0, 1.1]}
            ticks={[0, 1]}
            tickFormatter={(value) => value === 0 ? "Off" : "On"}
            orientation="left"
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#82ca9d"
            domain={['auto', 'auto']}
            tick={{ fontSize: 11 }}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === "state") {
                return [value === 1 ? "On" : "Off", "Machine State"];
              }
              return [value, "Runtime (s)"];
            }}
          />
          <Area
            yAxisId="left"
            type="stepAfter"
            dataKey="state"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
            strokeWidth={2}
            name="state"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="runtime"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.3}
            strokeWidth={2}
            name="runtime"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
