import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Eye, Clock, CheckCircle, XCircle, Truck } from "lucide-react";

interface Order {
  id: string;
  customer: string;
  items: { name: string; quantity: number; price: number }[];
  status: "Pending" | "Preparing" | "Ready" | "Out for Delivery" | "Delivered" | "Cancelled";
  address: string;
  phone: string;
  orderTime: string;
  deliveryTime: string;
  total: number;
  deliveryBoy?: string;
}

const mockOrders: Order[] = [
  {
    id: "#1234",
    customer: "John Doe",
    items: [
      { name: "Dal Rice", quantity: 2, price: 60 },
      { name: "Roti", quantity: 4, price: 20 }
    ],
    status: "Pending",
    address: "123 Main St, City",
    phone: "+91 9876543210",
    orderTime: "12:30 PM",
    deliveryTime: "1:30 PM",
    total: 140
  },
  {
    id: "#1235",
    customer: "Jane Smith",
    items: [
      { name: "Biryani", quantity: 1, price: 120 }
    ],
    status: "Preparing",
    address: "456 Oak Ave, City",
    phone: "+91 9876543211",
    orderTime: "1:00 PM",
    deliveryTime: "2:00 PM",
    total: 120
  },
  {
    id: "#1236",
    customer: "Mike Johnson",
    items: [
      { name: "Thali", quantity: 1, price: 180 }
    ],
    status: "Ready",
    address: "789 Pine Rd, City",
    phone: "+91 9876543212",
    orderTime: "11:45 AM",
    deliveryTime: "12:45 PM",
    total: 180
  }
];

const deliveryBoys = ["Rahul Kumar", "Amit Singh", "Priya Sharma", "Rohit Verma"];

export function VendorOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    // Update order status logic here
    console.log(`Updated order ${orderId} to ${newStatus}`);
  };

  const assignDeliveryBoy = (orderId: string, deliveryBoy: string) => {
    // Assign delivery boy logic here
    console.log(`Assigned ${deliveryBoy} to order ${orderId}`);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Preparing": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Ready": return "bg-green-100 text-green-800 border-green-300";
      case "Out for Delivery": return "bg-purple-100 text-purple-800 border-purple-300";
      case "Delivered": return "bg-gray-100 text-gray-800 border-gray-300";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "Pending": return <Clock className="h-4 w-4" />;
      case "Preparing": return <Clock className="h-4 w-4" />;
      case "Ready": return <CheckCircle className="h-4 w-4" />;
      case "Out for Delivery": return <Truck className="h-4 w-4" />;
      case "Delivered": return <CheckCircle className="h-4 w-4" />;
      case "Cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (status === "all") return mockOrders;
    return mockOrders.filter(order => order.status === status);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Preparing">Preparing</TabsTrigger>
          <TabsTrigger value="Ready">Ready</TabsTrigger>
          <TabsTrigger value="Out for Delivery">In Transit</TabsTrigger>
          <TabsTrigger value="Delivered">Delivered</TabsTrigger>
        </TabsList>

        {["all", "Pending", "Preparing", "Ready", "Out for Delivery", "Delivered"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid gap-4">
              {filterOrdersByStatus(status).map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customer} • {order.items.length} items • ₹{order.total}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Order: {order.orderTime} | Delivery: {order.deliveryTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => updateOrderStatus(order.id, value as Order["status"])}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Preparing">Preparing</SelectItem>
                            <SelectItem value="Ready">Ready</SelectItem>
                            <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Order Details - {selectedOrder?.id}</SheetTitle>
                            </SheetHeader>
                            {selectedOrder && (
                              <div className="space-y-4 mt-4">
                                <div>
                                  <h4 className="font-medium">Customer Information</h4>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.customer}</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                                  <p className="text-sm text-muted-foreground">{selectedOrder.address}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                      </div>
                                    ))}
                                    <div className="border-t pt-2 flex justify-between font-medium">
                                      <span>Total</span>
                                      <span>₹{selectedOrder.total}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Assign Delivery Boy</h4>
                                  <Select onValueChange={(value) => assignDeliveryBoy(selectedOrder.id, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select delivery boy" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {deliveryBoys.map((boy) => (
                                        <SelectItem key={boy} value={boy}>{boy}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}