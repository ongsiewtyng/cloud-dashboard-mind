
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface LogReasonSelectorProps {
  currentStatus: "0" | "1";
  newLogReason: string;
  setNewLogReason: (reason: string) => void;
  onAddLog: (status: "0" | "1") => void;
}

export function LogReasonSelector({ 
  currentStatus, 
  newLogReason, 
  setNewLogReason, 
  onAddLog 
}: LogReasonSelectorProps) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-4">
        {currentStatus === "0" ? (
          <>
            <div className="flex-1 space-y-1">
              <Label htmlFor="reason">Downtime Reason</Label>
              <Select value={newLogReason} onValueChange={setNewLogReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="setup">Setup/Changeover</SelectItem>
                  <SelectItem value="material">Material Shortage</SelectItem>
                  <SelectItem value="operator">No Operator</SelectItem>
                  <SelectItem value="quality">Quality Issue</SelectItem>
                  <SelectItem value="planned">Planned Downtime</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                  onClick={() => onAddLog("0")}
                  disabled={!newLogReason}>
                Record
              </Button>
            </div>
          </>
        ) : (
          <Button 
            className="w-full" 
            onClick={() => onAddLog("1")}>
            Record Running Status
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <span>Automatic simulation is active. The system is generating both running and downtime records.</span>
      </div>
    </div>
  );
}
