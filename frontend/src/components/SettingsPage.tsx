'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, User, Lock, Eye, EyeOff,
  Save, LogOut, Trash2, Shield,
  Moon, Sun, Palette
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface UserSettings {
  email: string;
  firstName: string;
  lastName: string;
  darkMode: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    email: user?.email || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    darkMode: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSettingsChange = (key: keyof UserSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async () => {
  setIsLoading(true);
  try {
    await axios.put('/auth/profile', {
      first_name: settings.firstName,
      last_name: settings.lastName,
      email: settings.email
    });
    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Profile update error:', error);
    toast.error('Failed to update profile');
  } finally {
    setIsLoading(false);
  }
  };

 const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('New passwords do not match');
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    toast.error('Password must be at least 6 characters');
    return;
  }

  setIsLoading(true);
  try {
    await axios.put('/auth/change-password', {
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    });
    toast.success('Password changed successfully');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  } catch (error) {
    console.error('Password change error:', error);
    // @ts-expect-error: error may not have 'response', but we want to check for it
    if (error.response?.status === 401) {
      toast.error('Current password is incorrect');
    } else {
      toast.error('Failed to change password');
    }
  } finally {
    setIsLoading(false);
  }
  };
  

const handleDeleteAccount = async () => {
  if (!deleteConfirm) {
    setDeleteConfirm(true);
    toast.error('Click again to confirm account deletion');
    return;
  }

  setIsLoading(true);
  try {
    const response = await axios.delete('/auth/delete-account', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 200) {
      toast.success('Account deleted successfully');
      
      localStorage.removeItem('token');
      
      logout();
      
      window.location.href = '/';
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Delete account error:', error);
    
    if (error.response?.status === 500) {
      toast.error('Server error - please contact support');
      console.error('Server error details:', error.response.data);
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error - please check your connection');
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    } else {
      toast.error('Failed to delete account');
    }
    
    setDeleteConfirm(false);
  } finally {
    setIsLoading(false);
  }
};

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    handleSettingsChange('darkMode', !isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl border-0 animate-scale-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
              <Settings className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Login Required</h3>
            <p className="text-gray-500 mb-4">Please login to access settings</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-xl" />
                <div className="relative p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-xl">
                  <Settings className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={settings.firstName}
                      onChange={(e) => handleSettingsChange('firstName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={settings.lastName}
                      onChange={(e) => handleSettingsChange('lastName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingsChange('email', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative mt-2">
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="mt-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="mt-2"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                  <p className="text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteConfirm ? 'Confirm Delete Account' : 'Delete Account'}
                  </Button>
                  {deleteConfirm && (
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirm(false)}
                      className="ml-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  App Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      Dark Mode
                    </h3>
                    <p className="text-sm text-gray-600">Toggle dark theme for the application</p>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-center">
          <Card 
            className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer animate-scale-in max-w-sm w-full" 
            onClick={logout}
          >
            <CardContent className="p-6 text-center">
              <LogOut className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Log Out</h3>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}