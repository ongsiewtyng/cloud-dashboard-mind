
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MachineRecord } from "@/lib/machine-service"

interface UsageChartProps {
  machines: MachineRecord[]
}

export function UsageChart({ machines }: UsageChartProps) {
  const data = machines.map((machine) => ({
    name: machine.latestData?.machineNumber || 'Unknown',
    cycle: parseFloat(machine.latestData?.cycleTime || "0"),
    production: parseInt(machine.latestData?.productionResults || "0", 10),
  }))

  return (
    <Card className="widget">
      <CardHeader>
        <CardTitle>Machine Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cycle"
                name="Cycle Time"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="production"
                name="Production Count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
