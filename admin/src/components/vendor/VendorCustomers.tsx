import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, MapPin, Package, CheckCircle, XCircle } from "lucide-react";

interface AssignedCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  deliveryDate: string;
  deliveryTime: string;
  items: { name: string; quantity: number }[];
  totalAmount: number;
  status: "Pending" | "Accepted" | "Rejected";
  assignedDate: string;
}

const mockAssignedCustomers: AssignedCustomer[] = [
  {
    id: "CUST001",
    name: "Rajesh Kumar",
    phone: "+91 9876543210",
    address: "123 MG Road, Bangalore",
    city: "Bangalore",
    deliveryDate: "2024-01-20",
    deliveryTime: "12:30 PM",
    items: [
      { name: "Dal Rice", quantity: 2 },
      { name: "Sabzi", quantity: 1 },
      { name: "Roti", quantity: 4 }
    ],
    totalAmount: 180,
    status: "Pending",
    assignedDate: "2024-01-18"
  },
  {
    id: "CUST002",
    name: "Priya Sharma",
    phone: "+91 9876543211",
    address: "456 Brigade Road, Bangalore",
    city: "Bangalore",
    deliveryDate: "2024-01-21",
    deliveryTime: "1:00 PM",
    items: [
      { name: "Biryani", quantity: 1 },
      { name: "Raita", quantity: 1 }
    ],
    totalAmount: 150,
    status: "Accepted",
    assignedDate: "2024-01-19"
  },
  {
    id: "CUST003",
    name: "Amit Singh",
    phone: "+91 9876543212",
    address: "789 Commercial Street, Bangalore",
    city: "Bangalore",
    deliveryDate: "2024-01-22",
    deliveryTime: "2:00 PM",
    items: [
      { name: "Thali", quantity: 1 }
    ],
    totalAmount: 200,
    status: "Pending",
    assignedDate: "2024-01-20"
  }
];

export function VendorCustomers() {
  const [customers, setCustomers] = useState(mockAssignedCustomers);
  const [sortBy, setSortBy] = useState<string>("deliveryDate");

  const handleStatusUpdate = (customerId: string, newStatus: "Accepted" | "Rejected") => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, status: newStatus }
          : customer
      )
    );
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    switch (sortBy) {
      case "deliveryDate":
        return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      case "city":
        return a.city.localeCompare(b.city);
      case "amount":
        return b.totalAmount - a.totalAmount;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Accepted": return "bg-green-100 text-green-800 border-green-300";
      case "Rejected": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const pendingCount = customers.filter(c => c.status === "Pending").length;
  const acceptedCount = customers.filter(c => c.status === "Accepted").length;
  const rejectedCount = customers.filter(c => c.status === "Rejected").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assigned Customers</h1>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deliveryDate">Delivery Date</SelectItem>
            <SelectItem value="name">Customer Name</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="amount">Order Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
            <p className="text-xs text-muted-foreground">Ready to prepare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Orders</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Declined orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {sortedCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Order ID: {customer.id}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{customer.deliveryDate} at {customer.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{customer.address}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">Items ({customer.items.length}):</p>
                        <ul className="text-muted-foreground">
                          {customer.items.map((item, index) => (
                            <li key={index}>• {item.name} x {item.quantity}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="font-medium">
                        Total: ₹{customer.totalAmount}
                      </div>
                    </div>
                  </div>
                </div>

                {customer.status === "Pending" && (
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate(customer.id, "Accepted")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleStatusUpdate(customer.id, "Rejected")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}