import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Upload, 
  Palette, 
  Bell, 
  Users, 
  Shield, 
  IndianRupee,
  Save,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Manager' | 'Support';
  status: 'Active' | 'Inactive';
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  
  // Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    supportEmail: 'support@foodapp.com',
    helpline: '+91 98765 43210',
    address: '123 Business District, Mumbai, Maharashtra 400001'
  });

  // Feature Toggles
  const [features, setFeatures] = useState({
    pushNotifications: true,
    reviews: true,
    referralSystem: true
  });

  // Global Settings
  const [globalSettings, setGlobalSettings] = useState({
    defaultSkipCredits: 6,
    mealPricing: 150,
    taxPercentage: 18
  });

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([
    { id: '1', name: 'John Doe', email: 'john@foodapp.com', role: 'Super Admin', status: 'Active' },
    { id: '2', name: 'Jane Smith', email: 'jane@foodapp.com', role: 'Manager', status: 'Active' },
    { id: '3', name: 'Mike Johnson', email: 'mike@foodapp.com', role: 'Support', status: 'Inactive' }
  ]);

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'Support' as AdminUser['role']
  });

  const handleSave = (section: string) => {
    toast({
      title: "Settings Updated",
      description: `${section} settings have been saved successfully.`,
    });
  };

  const handleAddAdmin = () => {
    if (newAdmin.name && newAdmin.email) {
      const admin: AdminUser = {
        id: Date.now().toString(),
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: 'Active'
      };
      setAdminUsers([...adminUsers, admin]);
      setNewAdmin({ name: '', email: '', role: 'Support' });
      toast({
        title: "Admin Added",
        description: `${newAdmin.name} has been added as ${newAdmin.role}.`,
      });
    }
  };

  const handleRemoveAdmin = (id: string) => {
    setAdminUsers(adminUsers.filter(admin => admin.id !== id));
    toast({
      title: "Admin Removed",
      description: "Admin user has been removed successfully.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Platform-wide control center for system configuration</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="users">Admin Users</TabsTrigger>
          <TabsTrigger value="global">Global Values</TabsTrigger>
        </TabsList>

        {/* Business Information */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
              <CardDescription>Update your company's contact information and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Support Email</span>
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={businessInfo.supportEmail}
                    onChange={(e) => setBusinessInfo({...businessInfo, supportEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="helpline" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Helpline Number</span>
                  </Label>
                  <Input
                    id="helpline"
                    value={businessInfo.helpline}
                    onChange={(e) => setBusinessInfo({...businessInfo, helpline: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Business Address</span>
                </Label>
                <Textarea
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  rows={3}
                />
              </div>
              <Button onClick={() => handleSave('Business Information')}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Company Logo</span>
              </CardTitle>
              <CardDescription>Upload and update your company logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommended size: 200x200px, PNG or JPG
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Theme Colors</span>
              </CardTitle>
              <CardDescription>Customize the platform's color scheme (Optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded border bg-primary"></div>
                    <Input type="color" value="#3b82f6" className="w-16 h-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded border bg-secondary"></div>
                    <Input type="color" value="#64748b" className="w-16 h-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded border bg-accent"></div>
                    <Input type="color" value="#f1f5f9" className="w-16 h-8" />
                  </div>
                </div>
              </div>
              <Button onClick={() => handleSave('Theme Colors')}>
                <Save className="h-4 w-4 mr-2" />
                Apply Theme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Global Features</span>
              </CardTitle>
              <CardDescription>Toggle platform-wide features on or off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the platform to send push notifications to users
                  </p>
                </div>
                <Switch
                  checked={features.pushNotifications}
                  onCheckedChange={(checked) => setFeatures({...features, pushNotifications: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Enable Reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to leave reviews and ratings for meals and providers
                  </p>
                </div>
                <Switch
                  checked={features.reviews}
                  onCheckedChange={(checked) => setFeatures({...features, reviews: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Referral System</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable the referral program for users to earn rewards
                  </p>
                </div>
                <Switch
                  checked={features.referralSystem}
                  onCheckedChange={(checked) => setFeatures({...features, referralSystem: checked})}
                />
              </div>
              <Button onClick={() => handleSave('Feature Settings')}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Users */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Admin User Management</span>
              </CardTitle>
              <CardDescription>Add, remove, and manage admin users and their roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Admin */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-4">Add New Admin User</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <Input
                    placeholder="Full Name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  />
                  <Input
                    placeholder="Email Address"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  />
                  <Select value={newAdmin.role} onValueChange={(value: AdminUser['role']) => setNewAdmin({...newAdmin, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddAdmin}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>
              </div>

              {/* Existing Admins */}
              <div className="space-y-4">
                <h3 className="font-medium">Current Admin Users</h3>
                {adminUsers.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{admin.name}</span>
                        <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'}>
                          {admin.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">{admin.role}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id)}
                      disabled={admin.role === 'Super Admin'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Values */}
        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IndianRupee className="h-5 w-5" />
                <span>Global System Values</span>
              </CardTitle>
              <CardDescription>Set default values and pricing rules for the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="skipCredits">Default Skip Credits Per User</Label>
                  <Input
                    id="skipCredits"
                    type="number"
                    min="1"
                    max="30"
                    value={globalSettings.defaultSkipCredits}
                    onChange={(e) => setGlobalSettings({...globalSettings, defaultSkipCredits: Number(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of meals users can skip per subscription period
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealPricing">Default Meal Pricing (₹)</Label>
                  <Input
                    id="mealPricing"
                    type="number"
                    min="50"
                    value={globalSettings.mealPricing}
                    onChange={(e) => setGlobalSettings({...globalSettings, mealPricing: Number(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Base price for meals across the platform
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={globalSettings.taxPercentage}
                    onChange={(e) => setGlobalSettings({...globalSettings, taxPercentage: Number(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tax percentage applied to orders (if applicable)
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button onClick={() => handleSave('Global Values')}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Global Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
