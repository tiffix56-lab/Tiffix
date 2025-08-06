import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Gift, 
  AlertTriangle, 
  Settings,
  TrendingUp,
  Search,
  Filter,
  Eye
} from "lucide-react";

// Mock data
const referralData = [
  {
    id: 1,
    referrerName: "John Doe",
    referrerEmail: "john@example.com",
    refereeName: "Jane Smith",
    refereeEmail: "jane@example.com",
    creditsEarned: 50,
    creditsRedeemed: 25,
    status: "active",
    dateReferred: "2024-01-15",
    fraudRisk: "low"
  },
  {
    id: 2,
    referrerName: "Mike Johnson",
    referrerEmail: "mike@example.com",
    refereeName: "Sarah Wilson",
    refereeEmail: "sarah@example.com", 
    creditsEarned: 100,
    creditsRedeemed: 100,
    status: "completed",
    dateReferred: "2024-01-10",
    fraudRisk: "medium"
  },
  {
    id: 3,
    referrerName: "Bob Smith",
    referrerEmail: "bob@example.com",
    refereeName: "Alice Brown",
    refereeEmail: "alice@example.com",
    creditsEarned: 75,
    creditsRedeemed: 0,
    status: "pending",
    dateReferred: "2024-01-20",
    fraudRisk: "high"
  }
];

const topReferrers = [
  { name: "John Doe", referralCount: 12, totalCredits: 600 },
  { name: "Mike Johnson", referralCount: 8, totalCredits: 400 },
  { name: "Sarah Lee", referralCount: 6, totalCredits: 300 },
  { name: "Bob Smith", referralCount: 5, totalCredits: 250 },
  { name: "Alice Brown", referralCount: 4, totalCredits: 200 }
];

const creditHistory = [
  {
    id: 1,
    userName: "John Doe",
    action: "Earned",
    amount: 50,
    reason: "Successful referral - Jane Smith",
    date: "2024-01-15",
    balance: 150
  },
  {
    id: 2,
    userName: "John Doe", 
    action: "Redeemed",
    amount: -25,
    reason: "Order payment",
    date: "2024-01-18",
    balance: 125
  },
  {
    id: 3,
    userName: "Mike Johnson",
    action: "Earned", 
    amount: 100,
    reason: "Successful referral - Sarah Wilson",
    date: "2024-01-10",
    balance: 300
  }
];

export default function ReferralManagement() {
  const [maxReferralReward, setMaxReferralReward] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const stats = [
    {
      title: "Total Referrals",
      value: "156",
      description: "All time referrals",
      icon: Users,
      change: "+12%"
    },
    {
      title: "Active Referrals",
      value: "89",
      description: "Currently active",
      icon: TrendingUp,
      change: "+8%"
    },
    {
      title: "Credits Distributed",
      value: "12,450",
      description: "Total credits given",
      icon: Gift,
      change: "+15%"
    },
    {
      title: "Fraud Cases",
      value: "3",
      description: "Detected this month",
      icon: AlertTriangle,
      change: "-2%"
    }
  ];

  const filteredReferrals = referralData.filter(referral => {
    const matchesSearch = referral.referrerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         referral.refereeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || referral.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getFraudBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium Risk</Badge>;
      case "low":
        return <Badge variant="default">Low Risk</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Management</h1>
          <p className="text-muted-foreground">
            Track and manage user referrals, detect fraud, and monitor credit distribution
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Referral Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Referral Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxReward">Maximum Referral Reward</Label>
                <Input
                  id="maxReward"
                  type="number"
                  value={maxReferralReward}
                  onChange={(e) => setMaxReferralReward(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <Button className="w-full">Save Settings</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="text-xs text-green-600 mt-1">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="referrals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="referrals">Referral Tracking</TabsTrigger>
          <TabsTrigger value="top-referrers">Top Referrers</TabsTrigger>
          <TabsTrigger value="credit-history">Credit History</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Tracking</CardTitle>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search referrals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Credits Earned</TableHead>
                    <TableHead>Credits Redeemed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fraud Risk</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.referrerName}</div>
                          <div className="text-sm text-muted-foreground">{referral.referrerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.refereeName}</div>
                          <div className="text-sm text-muted-foreground">{referral.refereeEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">+{referral.creditsEarned}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-orange-600">-{referral.creditsRedeemed}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>{getFraudBadge(referral.fraudRisk)}</TableCell>
                      <TableCell>{referral.dateReferred}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-referrers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Total Referrals</TableHead>
                    <TableHead>Credits Earned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topReferrers.map((referrer, index) => (
                    <TableRow key={referrer.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{index + 1}</span>
                          {index < 3 && <Gift className="w-4 h-4 text-yellow-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{referrer.name}</TableCell>
                      <TableCell>{referrer.referralCount}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {referrer.totalCredits} credits
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit History Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.userName}</TableCell>
                      <TableCell>
                        <Badge variant={entry.action === "Earned" ? "default" : "secondary"}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          entry.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {entry.amount > 0 ? "+" : ""}{entry.amount}
                        </span>
                      </TableCell>
                      <TableCell>{entry.reason}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">{entry.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}