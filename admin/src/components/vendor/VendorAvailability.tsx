import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Clock, Calendar as CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface WorkingHours {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface BlackoutDate {
  date: string;
  reason: string;
}

const initialWorkingHours: WorkingHours[] = [
  { day: "Monday", enabled: true, startTime: "09:00", endTime: "21:00" },
  { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "21:00" },
  { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "21:00" },
  { day: "Thursday", enabled: true, startTime: "09:00", endTime: "21:00" },
  { day: "Friday", enabled: true, startTime: "09:00", endTime: "21:00" },
  { day: "Saturday", enabled: true, startTime: "10:00", endTime: "22:00" },
  { day: "Sunday", enabled: false, startTime: "10:00", endTime: "20:00" },
];

export function VendorAvailability() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(initialWorkingHours);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([
    { date: "2024-01-25", reason: "National Holiday" },
    { date: "2024-02-14", reason: "Personal Leave" },
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blackoutReason, setBlackoutReason] = useState("");

  const updateWorkingHours = (index: number, field: keyof WorkingHours, value: string | boolean) => {
    setWorkingHours(prev => 
      prev.map((hour, i) => 
        i === index ? { ...hour, [field]: value } : hour
      )
    );
  };

  const addBlackoutDate = () => {
    if (selectedDate && blackoutReason.trim()) {
      const newBlackout: BlackoutDate = {
        date: format(selectedDate, "yyyy-MM-dd"),
        reason: blackoutReason.trim()
      };
      setBlackoutDates(prev => [...prev, newBlackout]);
      setSelectedDate(undefined);
      setBlackoutReason("");
    }
  };

  const removeBlackoutDate = (dateToRemove: string) => {
    setBlackoutDates(prev => prev.filter(date => date.date !== dateToRemove));
  };

  const isBlackoutDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blackoutDates.some(blackout => blackout.date === dateStr);
  };

  const getTotalWorkingHours = () => {
    return workingHours
      .filter(hour => hour.enabled)
      .reduce((total, hour) => {
        const start = new Date(`2024-01-01T${hour.startTime}`);
        const end = new Date(`2024-01-01T${hour.endTime}`);
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + diff;
      }, 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Availability Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge variant={isAvailable ? "default" : "destructive"}>
              {isAvailable ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Available
                </>
              )}
            </Badge>
          </div>
          <Switch
            checked={isAvailable}
            onCheckedChange={setIsAvailable}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium">Total Weekly Hours: {getTotalWorkingHours()} hours</p>
            </div>
            
            {workingHours.map((hour, index) => (
              <div key={hour.day} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-20">
                  <Label className="font-medium">{hour.day}</Label>
                </div>
                <Switch
                  checked={hour.enabled}
                  onCheckedChange={(checked) => updateWorkingHours(index, 'enabled', checked)}
                />
                {hour.enabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hour.startTime}
                        onChange={(e) => updateWorkingHours(index, 'startTime', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hour.endTime}
                        onChange={(e) => updateWorkingHours(index, 'endTime', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </>
                )}
                {!hour.enabled && (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Blackout Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full"
                  modifiers={{
                    blackout: (date) => isBlackoutDate(date),
                  }}
                  modifiersStyles={{
                    blackout: {
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                    },
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Unavailability</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Personal leave, Holiday, etc."
                  value={blackoutReason}
                  onChange={(e) => setBlackoutReason(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={addBlackoutDate}
                disabled={!selectedDate || !blackoutReason.trim()}
                className="w-full"
              >
                Add Blackout Date
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Blackout Dates</Label>
              {blackoutDates.length > 0 ? (
                <div className="space-y-2">
                  {blackoutDates.map((blackout, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(blackout.date), "MMM dd, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{blackout.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeBlackoutDate(blackout.date)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No blackout dates set</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}