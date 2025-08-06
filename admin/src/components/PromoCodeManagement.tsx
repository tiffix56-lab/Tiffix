import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Copy, Calendar, Percent, IndianRupee, Users, Tag } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  applicablePlans: string[];
  isActive: boolean;
  createdAt: string;
}

const mockPromoCodes: PromoCode[] = [
  {
    id: '1',
    code: 'WELCOME50',
    description: 'Welcome bonus for new users',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 200,
    usageLimit: 1000,
    usedCount: 234,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    applicablePlans: ['monthly', 'quarterly'],
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    code: 'SAVE20',
    description: '20% off on all plans',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 500,
    maxDiscount: 200,
    usageLimit: 500,
    usedCount: 89,
    validFrom: '2024-01-15',
    validUntil: '2024-02-15',
    applicablePlans: ['yearly'],
    isActive: true,
    createdAt: '2024-01-15'
  }
];

export function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(mockPromoCodes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discountType: 'flat' as const,
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 100,
    validFrom: '',
    validUntil: '',
    applicablePlans: [] as string[]
  });

  const handleCreateCode = () => {
    const code: PromoCode = {
      id: Date.now().toString(),
      ...newCode,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setPromoCodes([...promoCodes, code]);
    setIsCreateDialogOpen(false);
    setNewCode({
      code: '',
      description: '',
      discountType: 'flat',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 100,
      validFrom: '',
      validUntil: '',
      applicablePlans: []
    });
    
    toast({
      title: "Promo Code Created",
      description: "New promo code has been created successfully."
    });
  };

  const handleDeleteCode = (codeId: string) => {
    setPromoCodes(promoCodes.filter(c => c.id !== codeId));
    toast({
      title: "Promo Code Deleted",
      description: "Promo code has been deleted successfully."
    });
  };

  const toggleCodeStatus = (codeId: string) => {
    setPromoCodes(promoCodes.map(c => 
      c.id === codeId ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Code "${code}" copied to clipboard.`
    });
  };

  const getStatusBadge = (code: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(code.validFrom);
    const validUntil = new Date(code.validUntil);
    
    if (!code.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (now < validFrom) return <Badge variant="outline">Scheduled</Badge>;
    if (now > validUntil) return <Badge variant="destructive">Expired</Badge>;
    if (code.usedCount >= code.usageLimit) return <Badge variant="destructive">Limit Reached</Badge>;
    return <Badge variant="default">Active</Badge>;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promo Code Management</h1>
          <p className="text-muted-foreground">Create and manage promotional codes and offers</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
              <DialogDescription>
                Design a promotional code with discount configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code</Label>
                  <Input
                    id="code"
                    value={newCode.code}
                    onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                    placeholder="e.g. WELCOME50"
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select 
                    value={newCode.discountType} 
                    onValueChange={(value: any) => setNewCode({...newCode, discountType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCode.description}
                  onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                  placeholder="Brief description of the offer"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountValue">
                    Discount Value {newCode.discountType === 'flat' ? '(₹)' : '(%)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={newCode.discountValue}
                    onChange={(e) => setNewCode({...newCode, discountValue: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="minOrderValue">Min Order Value (₹)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    value={newCode.minOrderValue}
                    onChange={(e) => setNewCode({...newCode, minOrderValue: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={newCode.maxDiscount}
                    onChange={(e) => setNewCode({...newCode, maxDiscount: Number(e.target.value)})}
                    disabled={newCode.discountType === 'flat'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={newCode.usageLimit}
                    onChange={(e) => setNewCode({...newCode, usageLimit: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={newCode.validFrom}
                    onChange={(e) => setNewCode({...newCode, validFrom: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={newCode.validUntil}
                    onChange={(e) => setNewCode({...newCode, validUntil: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCode}>Create Code</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Codes</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={code.description}>
                        {code.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {code.discountType === 'flat' ? (
                          <IndianRupee className="h-4 w-4" />
                        ) : (
                          <Percent className="h-4 w-4" />
                        )}
                        <span>{code.discountValue}</span>
                        {code.discountType === 'percentage' && code.maxDiscount && (
                          <span className="text-muted-foreground text-sm">
                            (max ₹{code.maxDiscount})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {code.usedCount}/{code.usageLimit}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${getUsagePercentage(code.usedCount, code.usageLimit)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(code.validFrom).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(code.validUntil).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCode(code.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={code.isActive}
                          onCheckedChange={() => toggleCodeStatus(code.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid gap-4">
            {promoCodes.filter(c => c.isActive && new Date() >= new Date(c.validFrom) && new Date() <= new Date(c.validUntil)).map((code) => (
              <Card key={code.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{code.code}</span>
                    {getStatusBadge(code)}
                  </CardTitle>
                  <CardDescription>{code.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="grid gap-4">
            {promoCodes.filter(c => c.isActive && new Date() < new Date(c.validFrom)).map((code) => (
              <Card key={code.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{code.code}</span>
                    {getStatusBadge(code)}
                  </CardTitle>
                  <CardDescription>{code.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expired">
          <div className="grid gap-4">
            {promoCodes.filter(c => new Date() > new Date(c.validUntil)).map((code) => (
              <Card key={code.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{code.code}</span>
                    {getStatusBadge(code)}
                  </CardTitle>
                  <CardDescription>{code.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}