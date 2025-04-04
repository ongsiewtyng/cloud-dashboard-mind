
import { ArduinoData } from "@/lib/arduino-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ArduinoDataLogProps {
  data: ArduinoData[];
}

export function ArduinoDataLog({ data }: ArduinoDataLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arduino Data Log</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Machine State</TableHead>
                <TableHead>Runtime (seconds)</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No data received yet. Start monitoring to see data.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.timestamp}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.machineState === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.machineState === 'True' ? 'Running' : 'Stopped'}
                      </span>
                    </TableCell>
                    <TableCell>{item.runTime}</TableCell>
                    <TableCell>{new Date(item.recordedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
