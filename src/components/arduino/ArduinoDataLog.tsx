
import { useState, useEffect } from "react";
import { ArduinoData } from "@/lib/arduino-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArduinoDataLogProps {
  data: ArduinoData[];
}

export function ArduinoDataLog({ data }: ArduinoDataLogProps) {
  const [showAll, setShowAll] = useState(false);
  const [filteredData, setFilteredData] = useState<ArduinoData[]>([]);
  const maxVisibleRows = 10;
  
  // Filter and sort data on each update
  useEffect(() => {
    // Include both ON and OFF records - we want to see all state changes
    // Sort data by recordedAt (newest first)
    const sortedData = [...data].sort((a, b) =>
        (parseInt(b.recordedAt?.toString() || '0') - parseInt(a.recordedAt?.toString() || '0'))
    );

    setFilteredData(showAll ? sortedData : sortedData.slice(0, maxVisibleRows));
  }, [data, showAll]);
  
  // Format time for better readability
  const formatTime = (timestamp: string | number) => {
    if (!timestamp) return "N/A";
    
    try {
      // Handle different timestamp formats
      const date = typeof timestamp === 'string' && !isNaN(Number(timestamp)) ? 
        new Date(parseInt(timestamp)) : 
        typeof timestamp === 'number' ? 
          new Date(timestamp) : 
          new Date(timestamp.toString());
          
      return date.toLocaleTimeString();
    } catch (err) {
      return timestamp.toString();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Arduino Data Log</span>
          {data.length > 0 && (
            <Badge variant="outline">
              {data.length} records
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Switch State</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No data received yet. Press the switch button to see data.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  // All items are now state changes by design
                  return (
                    <TableRow key={index} className="bg-gray-50">
                      <TableCell>{formatTime(item.timestamp)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.machineState === 'True' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.machineState === 'True' ? 'ON (Pressed)' : 'OFF (Released)'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          State Change
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.recordedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {data.length > maxVisibleRows && (
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Less" : `Show All (${data.length} records)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
