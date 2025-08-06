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
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Calendar, Utensils, Truck, Star, IndianRupee } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  duration: 'yearly' | 'quarterly' | 'monthly';
  mealsPerPlan: number;
  originalPrice: number;
  discountedPrice: number;
  freeDelivery: boolean;
  description: string;
  category: 'vendor' | 'homechef' | 'both';
  features: string[];
  isActive: boolean;
  createdAt: string;
}

const mockPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Premium Monthly',
    duration: 'monthly',
    mealsPerPlan: 60,
    originalPrice: 3600,
    discountedPrice: 2999,
    freeDelivery: true,
    description: 'Perfect for regular meal needs with premium quality',
    category: 'both',
    features: ['60 meals/month', 'Free delivery', 'Premium quality', '24/7 support'],
    isActive: true,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Basic Quarterly',
    duration: 'quarterly',
    mealsPerPlan: 150,
    originalPrice: 8500,
    discountedPrice: 7500,
    freeDelivery: false,
    description: 'Affordable quarterly plan for budget-conscious users',
    category: 'vendor',
    features: ['150 meals/quarter', 'Standard delivery', 'Basic support'],
    isActive: true,
    createdAt: '2024-01-10'
  }
];

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockPlans);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  const [newPlan, setNewPlan] = useState({
    name: '',
    duration: 'monthly' as const,
    mealsPerPlan: 30,
    originalPrice: 0,
    discountedPrice: 0,
    freeDelivery: false,
    description: '',
    category: 'both' as const,
    features: ['']
  });

  const handleCreatePlan = () => {
    const plan: SubscriptionPlan = {
      id: Date.now().toString(),
      ...newPlan,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setPlans([...plans, plan]);
    setIsCreateDialogOpen(false);
    setNewPlan({
      name: '',
      duration: 'monthly',
      mealsPerPlan: 30,
      originalPrice: 0,
      discountedPrice: 0,
      freeDelivery: false,
      description: '',
      category: 'both',
      features: ['']
    });
    
    toast({
      title: "Plan Created",
      description: "Subscription plan has been created successfully."
    });
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
    toast({
      title: "Plan Deleted",
      description: "Subscription plan has been deleted successfully."
    });
  };

  const togglePlanStatus = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const getDurationIcon = (duration: string) => {
    switch (duration) {
      case 'yearly': return <Calendar className="h-4 w-4" />;
      case 'quarterly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      vendor: 'bg-blue-100 text-blue-800',
      homechef: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800'
    };
    return variants[category as keyof typeof variants] || variants.both;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Create and manage subscription plans for users</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subscription Plan</DialogTitle>
              <DialogDescription>
                Design a custom subscription plan with detailed configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="e.g. Premium Monthly"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select 
                    value={newPlan.duration} 
                    onValueChange={(value: any) => setNewPlan({...newPlan, duration: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="meals">Meals per Plan</Label>
                  <Input
                    id="meals"
                    type="number"
                    value={newPlan.mealsPerPlan}
                    onChange={(e) => setNewPlan({...newPlan, mealsPerPlan: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={newPlan.originalPrice}
                    onChange={(e) => setNewPlan({...newPlan, originalPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="discountedPrice">Discounted Price (₹)</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    value={newPlan.discountedPrice}
                    onChange={(e) => setNewPlan({...newPlan, discountedPrice: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newPlan.category} 
                    onValueChange={(value: any) => setNewPlan({...newPlan, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor Food Only</SelectItem>
                      <SelectItem value="homechef">Home Chef Only</SelectItem>
                      <SelectItem value="both">Both Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="freeDelivery"
                    checked={newPlan.freeDelivery}
                    onCheckedChange={(checked) => setNewPlan({...newPlan, freeDelivery: checked})}
                  />
                  <Label htmlFor="freeDelivery">Free Delivery</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Brief description of the plan benefits"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan}>Create Plan</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="vendor">Vendor Plans</TabsTrigger>
          <TabsTrigger value="homechef">Home Chef Plans</TabsTrigger>
          <TabsTrigger value="both">Universal Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getDurationIcon(plan.duration)}
                        {plan.name}
                        <Badge className={getCategoryBadge(plan.category)}>
                          {plan.category === 'both' ? 'Universal' : plan.category}
                        </Badge>
                        {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Utensils className="mr-1 h-4 w-4" />
                        Meals
                      </div>
                      <div className="font-semibold">{plan.mealsPerPlan} meals</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <IndianRupee className="mr-1 h-4 w-4" />
                        Pricing
                      </div>
                      <div className="font-semibold">
                        ₹{plan.discountedPrice}
                        {plan.originalPrice > plan.discountedPrice && (
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            ₹{plan.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Truck className="mr-1 h-4 w-4" />
                        Delivery
                      </div>
                      <div className="font-semibold">
                        {plan.freeDelivery ? 'Free' : 'Paid'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        Duration
                      </div>
                      <div className="font-semibold capitalize">{plan.duration}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => togglePlanStatus(plan.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vendor">
          <div className="grid gap-6">
            {plans.filter(p => p.category === 'vendor' || p.category === 'both').map((plan) => (
              <Card key={plan.id}>
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="homechef">
          <div className="grid gap-6">
            {plans.filter(p => p.category === 'homechef' || p.category === 'both').map((plan) => (
              <Card key={plan.id}>
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="both">
          <div className="grid gap-6">
            {plans.filter(p => p.category === 'both').map((plan) => (
              <Card key={plan.id}>
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}