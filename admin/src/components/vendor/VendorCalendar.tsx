import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Package, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, getDay } from "date-fns";

interface CalendarOrder {
  id: string;
  customer: string;
  items: number;
  type: "Pickup" | "Delivery";
  time: string;
  amount: number;
  status: "Preparing" | "Ready" | "Picked Up" | "Delivered" | "Cancelled";
  providerType: "Vendor" | "Home Chef";
  mealName: string;
  address: string;
}

const mockCalendarData: Record<string, CalendarOrder[]> = {
  "2024-01-15": [
    { 
      id: "#1234", 
      customer: "John Doe", 
      items: 3, 
      type: "Delivery", 
      time: "12:30 PM", 
      amount: 180,
      status: "Preparing",
      providerType: "Vendor",
      mealName: "Chicken Biryani",
      address: "123 Main St, Mumbai"
    },
    { 
      id: "#1235", 
      customer: "Jane Smith", 
      items: 2, 
      type: "Pickup", 
      time: "1:00 PM", 
      amount: 120,
      status: "Ready",
      providerType: "Home Chef",
      mealName: "Dal Rice",
      address: "456 Park Ave, Mumbai"
    },
  ],
  "2024-01-16": [
    { 
      id: "#1236", 
      customer: "Mike Johnson", 
      items: 1, 
      type: "Delivery", 
      time: "11:30 AM", 
      amount: 60,
      status: "Picked Up",
      providerType: "Vendor",
      mealName: "Veggie Thali",
      address: "789 Oak Rd, Mumbai"
    },
    { 
      id: "#1237", 
      customer: "Sarah Wilson", 
      items: 4, 
      type: "Delivery", 
      time: "2:00 PM", 
      amount: 240,
      status: "Delivered",
      providerType: "Home Chef",
      mealName: "Mutton Curry",
      address: "321 Pine St, Mumbai"
    },
  ],
  "2024-01-17": [
    { 
      id: "#1238", 
      customer: "David Brown", 
      items: 2, 
      type: "Pickup", 
      time: "1:30 PM", 
      amount: 140,
      status: "Cancelled",
      providerType: "Vendor",
      mealName: "Fish Curry",
      address: "654 Cedar Ln, Mumbai"
    },
  ],
};

export function VendorCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<CalendarOrder | null>(null);

  const getOrdersForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    const orders = mockCalendarData[dateStr] || [];
    
    if (filterType === "all") return orders;
    return orders.filter(order => order.type === filterType);
  };

  const hasOrdersOnDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mockCalendarData[dateStr] && mockCalendarData[dateStr].length > 0;
  };

  const getTotalOrdersForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mockCalendarData[dateStr]?.length || 0;
  };

  const getStatusDotsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const orders = mockCalendarData[dateStr] || [];
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return statusCounts;
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Preparing": return "hsl(var(--warning))";
      case "Ready": return "hsl(16 100% 60%)";
      case "Picked Up": return "hsl(var(--vendor-accent))";
      case "Delivered": return "hsl(var(--success))";
      case "Cancelled": return "hsl(var(--destructive))";
      default: return "hsl(var(--muted-foreground))";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "Preparing": return "🟡";
      case "Ready": return "🟠";
      case "Picked Up": return "🔵";
      case "Delivered": return "🟢";
      case "Cancelled": return "🔴";
      default: return "⚪";
    }
  };

  // Custom calendar rendering
  const renderCustomCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days from previous month
    const startDay = getDay(monthStart);
    const paddingDays = Array.from({ length: startDay }, (_, i) => {
      const day = new Date(monthStart);
      day.setDate(day.getDate() - (startDay - i));
      return day;
    });

    const allDays = [...paddingDays, ...daysInMonth];
    
    return (
      <div className="bg-card rounded-lg border border-border shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {allDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isCurrentDay = isToday(day);
            const hasOrders = hasOrdersOnDate(day);
            const statusDots = getStatusDotsForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-[90px] p-3 border-b border-r border-border cursor-pointer hover:bg-accent/20 transition-all duration-200 ${
                  !isCurrentMonth ? 'text-muted-foreground bg-muted/10' : 'bg-card'
                } ${isSelected ? 'bg-primary/20 border-primary ring-1 ring-primary/30' : ''} ${
                  isCurrentDay ? 'bg-primary/10 border-primary/50' : ''
                } ${hasOrders ? 'hover:shadow-hover' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentDay ? 'text-primary font-bold' : 'text-card-foreground'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                  {day.getDate()}
                </div>
                {hasOrders && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(statusDots).map(([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-background/50 backdrop-blur-sm"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <span className="text-xs font-medium text-card-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {getTotalOrdersForDate(day)} order{getTotalOrdersForDate(day) !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📅 Order Calendar</h1>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="Delivery">Delivery Only</SelectItem>
              <SelectItem value="Pickup">Pickup Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar and Orders Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          {renderCustomCalendar()}
        </div>

        {/* Selected Date Orders */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                📅 {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
                <Badge variant="secondary" className="text-xs">
                  {selectedDateOrders.length} order{selectedDateOrders.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateOrders.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`p-4 border border-border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-hover ${
                        selectedOrder?.id === order.id ? 'border-primary bg-primary/10 shadow-focus' : 'bg-card hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-card-foreground">{order.id}</span>
                          <Badge variant={order.type === "Delivery" ? "default" : "secondary"} className="shadow-sm">
                            {order.type === "Delivery" ? <Truck className="h-3 w-3 mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                            {order.type}
                          </Badge>
                          <Badge 
                            style={{ 
                              backgroundColor: getStatusColor(order.status),
                              color: 'white'
                            }}
                            className="border-0 shadow-sm"
                          >
                            {getStatusEmoji(order.status)} {order.status}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold text-primary">₹{order.amount}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-card-foreground">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.mealName} • <span className="text-accent">{order.providerType}</span></p>
                        <p className="text-xs text-muted-foreground">{order.items} items • {order.time}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.address}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border bg-muted/20 rounded-lg p-3 mt-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-card-foreground">Total Orders:</span>
                        <Badge variant="outline" className="font-bold">{selectedDateOrders.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-card-foreground">Total Revenue:</span>
                        <span className="font-bold text-primary text-lg">₹{selectedDateOrders.reduce((sum, order) => sum + order.amount, 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-16 w-16 mx-auto mb-6 opacity-40" />
                  <p className="text-lg font-medium mb-2">No orders scheduled</p>
                  <p className="text-sm">Select a date with orders to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}