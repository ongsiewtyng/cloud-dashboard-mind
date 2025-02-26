
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Machine } from "@/lib/machine-service"

interface UsageChartProps {
  machines: Machine[]
}

export function UsageChart({ machines }: UsageChartProps) {
  const data = machines.map((machine) => ({
    name: machine.name,
    cpu: machine.cpuUsage,
    memory: machine.memoryUsage,
  }))

  return (
    <Card className="widget">
      <CardHeader>
        <CardTitle>Resource Usage Overview</CardTitle>
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
                dataKey="cpu"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="memory"
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
