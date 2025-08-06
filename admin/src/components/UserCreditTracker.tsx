import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Gift,
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'credit' | 'debit' | 'refund' | 'bonus' | 'penalty';
  amount: number;
  reason: string;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  adminId?: string;
  adminName?: string;
}

interface MealSkip {
  id: string;
  date: string;
  reason?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
}

interface UserCredit {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastTransaction: string;
  status: 'active' | 'suspended' | 'limited';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  originalEndDate: string;
  mealsSkipped: number;
  maxSkipsAllowed: number;
  skipHistory: MealSkip[];
}

const mockTransactions: CreditTransaction[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'John Doe',
    userAvatar: '/api/placeholder/40/40',
    type: 'credit',
    amount: 50.00,
    reason: 'Order refund',
    description: 'Refund for cancelled order #ORD-001',
    balanceBefore: 25.50,
    balanceAfter: 75.50,
    timestamp: '2024-12-20T10:30:00Z',
    status: 'completed',
    adminId: 'admin1',
    adminName: 'Admin User'
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Sarah Johnson',
    type: 'debit',
    amount: 25.00,
    reason: 'Order payment',
    description: 'Payment for order #ORD-002',
    balanceBefore: 100.00,
    balanceAfter: 75.00,
    timestamp: '2024-12-20T09:15:00Z',
    status: 'completed'
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Mike Wilson',
    type: 'bonus',
    amount: 10.00,
    reason: 'Referral bonus',
    description: 'Bonus for referring a new user',
    balanceBefore: 40.00,
    balanceAfter: 50.00,
    timestamp: '2024-12-19T16:45:00Z',
    status: 'completed',
    adminId: 'admin1',
    adminName: 'Admin User'
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Lisa Chen',
    type: 'credit',
    amount: 15.75,
    reason: 'Manual adjustment',
    description: 'Credit adjustment for service issue',
    balanceBefore: 12.25,
    balanceAfter: 28.00,
    timestamp: '2024-12-19T14:20:00Z',
    status: 'completed',
    adminId: 'admin2',
    adminName: 'Support Team'
  }
];

const mockUsers: UserCredit[] = [
  {
    id: 'u1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    avatar: '/api/placeholder/40/40',
    currentBalance: 75.50,
    totalEarned: 325.00,
    totalSpent: 249.50,
    lastTransaction: '2024-12-20T10:30:00Z',
    status: 'active',
    tier: 'gold',
    subscriptionStartDate: '2024-11-01',
    subscriptionEndDate: '2025-01-05',
    originalEndDate: '2024-12-30',
    mealsSkipped: 3,
    maxSkipsAllowed: 6,
    skipHistory: [
      { id: 's1', date: '2024-11-15', reason: 'Traveling', mealType: 'lunch' },
      { id: 's2', date: '2024-12-02', reason: 'Sick', mealType: 'dinner' },
      { id: 's3', date: '2024-12-18', reason: 'Work meeting', mealType: 'breakfast' }
    ]
  },
  {
    id: 'u2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    currentBalance: 75.00,
    totalEarned: 180.00,
    totalSpent: 105.00,
    lastTransaction: '2024-12-20T09:15:00Z',
    status: 'active',
    tier: 'silver',
    subscriptionStartDate: '2024-10-15',
    subscriptionEndDate: '2025-01-15',
    originalEndDate: '2025-01-15',
    mealsSkipped: 0,
    maxSkipsAllowed: 6,
    skipHistory: []
  },
  {
    id: 'u3',
    name: 'Mike Wilson',
    email: 'mike.w@email.com',
    currentBalance: 50.00,
    totalEarned: 150.00,
    totalSpent: 100.00,
    lastTransaction: '2024-12-19T16:45:00Z',
    status: 'active',
    tier: 'bronze',
    subscriptionStartDate: '2024-11-10',
    subscriptionEndDate: '2025-02-12',
    originalEndDate: '2025-02-10',
    mealsSkipped: 1,
    maxSkipsAllowed: 6,
    skipHistory: [
      { id: 's4', date: '2024-12-10', reason: 'Family event', mealType: 'dinner' }
    ]
  },
  {
    id: 'u4',
    name: 'Lisa Chen',
    email: 'lisa.c@email.com',
    currentBalance: 28.00,
    totalEarned: 95.00,
    totalSpent: 67.00,
    lastTransaction: '2024-12-19T14:20:00Z',
    status: 'active',
    tier: 'silver',
    subscriptionStartDate: '2024-12-01',
    subscriptionEndDate: '2025-03-01',
    originalEndDate: '2025-03-01',
    mealsSkipped: 0,
    maxSkipsAllowed: 6,
    skipHistory: []
  }
];

const UserCreditTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>(mockTransactions);
  const [users, setUsers] = useState<UserCredit[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');

  const getTypeColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'credit': return 'bg-success text-success-foreground';
      case 'debit': return 'bg-destructive text-destructive-foreground';
      case 'refund': return 'bg-primary text-primary-foreground';
      case 'bonus': return 'bg-secondary text-secondary-foreground';
      case 'penalty': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: CreditTransaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTierColor = (tier: UserCredit['tier']) => {
    switch (tier) {
      case 'platinum': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'silver': return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'bronze': return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredUsers = users.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreditAdjustment = () => {
    if (!selectedUser || !adjustmentAmount) return;

    const amount = parseFloat(adjustmentAmount);
    const newTransaction: CreditTransaction = {
      id: `tx-${Date.now()}`,
      userId: selectedUser.id,
      userName: selectedUser.name,
      userAvatar: selectedUser.avatar,
      type: adjustmentType,
      amount: Math.abs(amount),
      reason: adjustmentReason || 'Manual adjustment',
      description: adjustmentDescription,
      balanceBefore: selectedUser.currentBalance,
      balanceAfter: adjustmentType === 'credit' 
        ? selectedUser.currentBalance + Math.abs(amount)
        : selectedUser.currentBalance - Math.abs(amount),
      timestamp: new Date().toISOString(),
      status: 'completed',
      adminId: 'current-admin',
      adminName: 'Current Admin'
    };

    setTransactions([newTransaction, ...transactions]);
    setUsers(users.map(user => 
      user.id === selectedUser.id 
        ? { ...user, currentBalance: newTransaction.balanceAfter }
        : user
    ));

    setIsAdjustmentDialogOpen(false);
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setAdjustmentDescription('');
    setSelectedUser(null);
  };

  // Statistics
  const totalCreditsIssued = transactions
    .filter(t => ['credit', 'refund', 'bonus'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCreditsUsed = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalActiveBalance = users.reduce((sum, u) => sum + u.currentBalance, 0);
  const averageBalance = totalActiveBalance / users.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Tracker</h1>
          <p className="text-muted-foreground">Monitor and manage user credit balances and transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Issued</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCreditsIssued.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+8.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCreditsUsed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+12.3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActiveBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across {users.length} users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per active user</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">User Balances</TabsTrigger>
          <TabsTrigger value="meal-skips">Meal Skip Tracker</TabsTrigger>
          <TabsTrigger value="adjustments">Manual Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user name or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions ({filteredTransactions.length})</CardTitle>
              <CardDescription>All credit transactions and balance changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Balance Change</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={transaction.userAvatar} />
                              <AvatarFallback>{transaction.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{transaction.userName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.type === 'debit' ? 'text-destructive' : 'text-success'}>
                            {transaction.type === 'debit' ? '-' : '+'}${transaction.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.reason}</div>
                            {transaction.description && (
                              <div className="text-sm text-muted-foreground">{transaction.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>${transaction.balanceBefore.toFixed(2)} → ${transaction.balanceAfter.toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {transaction.adminName || 'System'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge className={getTierColor(user.tier)}>
                      {user.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Current Balance</div>
                      <div className="font-bold text-lg">${user.currentBalance.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Earned</div>
                      <div className="font-medium text-success">${user.totalEarned.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Spent</div>
                      <div className="font-medium text-muted-foreground">${user.totalSpent.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Transaction</div>
                      <div className="font-medium">{new Date(user.lastTransaction).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => {setSelectedUser(user); setIsAdjustmentDialogOpen(true);}}
                  >
                    Adjust Credits
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meal-skips" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Meal Skip Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Skips Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Across all users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users Near Limit</CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">5+ skips used</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Extended Subscriptions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Auto-extended</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Skips</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.5</div>
                <p className="text-xs text-muted-foreground">Per user</p>
              </CardContent>
            </Card>
          </div>

          {/* Users Skip Details */}
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge className={getTierColor(user.tier)}>
                      {user.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Skip Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Meals Skipped</div>
                      <div className="flex items-center space-x-2">
                        <div className="text-lg font-bold">{user.mealsSkipped}/{user.maxSkipsAllowed}</div>
                        {user.mealsSkipped >= 5 && (
                          <AlertCircle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            user.mealsSkipped >= 5 ? 'bg-warning' : 
                            user.mealsSkipped >= 3 ? 'bg-primary' : 'bg-success'
                          }`}
                          style={{ width: `${(user.mealsSkipped / user.maxSkipsAllowed) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Remaining Skips</div>
                      <div className="text-lg font-bold">{user.maxSkipsAllowed - user.mealsSkipped}</div>
                    </div>
                  </div>

                  {/* Subscription Dates */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Original End Date</div>
                        <div className="font-medium">{new Date(user.originalEndDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current End Date</div>
                        <div className="font-medium">{new Date(user.subscriptionEndDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {user.subscriptionEndDate !== user.originalEndDate && (
                      <div className="text-xs text-success flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Extended by {Math.ceil((new Date(user.subscriptionEndDate).getTime() - new Date(user.originalEndDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                      </div>
                    )}
                  </div>

                  {/* Skip History */}
                  {user.skipHistory.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Recent Skips</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {user.skipHistory.slice(-3).map((skip) => (
                          <div key={skip.id} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                            <div>
                              <span className="font-medium">{skip.mealType}</span>
                              {skip.reason && (
                                <span className="text-muted-foreground"> - {skip.reason}</span>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(skip.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      {user.skipHistory.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{user.skipHistory.length - 3} more skips
                        </div>
                      )}
                    </div>
                  )}

                  {user.skipHistory.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No meal skips recorded
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Credit Adjustments</CardTitle>
              <CardDescription>Manage user credits with predefined actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col">
                  <Gift className="h-6 w-6 mb-2" />
                  Bulk Bonus Credits
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Award className="h-6 w-6 mb-2" />
                  Loyalty Rewards
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <RefreshCw className="h-6 w-6 mb-2" />
                  Refund Processing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Credit Adjustment Dialog */}
      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Credit Adjustment</DialogTitle>
            <DialogDescription>
              {selectedUser && `Adjust credits for ${selectedUser.name} (Current: $${selectedUser.currentBalance.toFixed(2)})`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adjustment-type">Type</Label>
                <Select value={adjustmentType} onValueChange={(value: 'credit' | 'debit') => setAdjustmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Add Credits</SelectItem>
                    <SelectItem value="debit">Deduct Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustment-amount">Amount ($)</Label>
                <Input
                  id="adjustment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Reason</Label>
              <Input
                id="adjustment-reason"
                placeholder="Reason for adjustment"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-description">Description (Optional)</Label>
              <Textarea
                id="adjustment-description"
                placeholder="Additional details about the adjustment"
                value={adjustmentDescription}
                onChange={(e) => setAdjustmentDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreditAdjustment} disabled={!adjustmentAmount || !adjustmentReason}>
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCreditTracker;