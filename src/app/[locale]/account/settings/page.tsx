"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Mail, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
  Smartphone,
  Volume2
} from "lucide-react";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Locale } from '@/lib/i1n-config';
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
      orderUpdates: true,
      promotions: true,
      newsletter: false
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    preferences: {
      theme: 'light',
      language: locale,
      currency: 'UZS',
      soundEffects: true,
      autoSave: true
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      sessionTimeout: 30
    }
  });
  
  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
    
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };
  
  const handleDeleteAccount = () => {
    toast({
      title: "Account Deletion Requested",
      description: "We'll process your request within 24 hours.",
      variant: "destructive"
    });
  };
  
  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "You'll receive an email with your data within 24 hours.",
    });
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
      </div>
      
      <Separator />
      
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about orders, promotions, and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch 
                checked={settings.notifications.email}
                onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
              </div>
              <Switch 
                checked={settings.notifications.push}
                onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Order Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about order status changes</p>
              </div>
              <Switch 
                checked={settings.notifications.orderUpdates}
                onCheckedChange={(checked) => handleSettingChange('notifications', 'orderUpdates', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Promotions & Offers</Label>
                <p className="text-sm text-muted-foreground">Receive special offers and discounts</p>
              </div>
              <Switch 
                checked={settings.notifications.promotions}
                onCheckedChange={(checked) => handleSettingChange('notifications', 'promotions', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy settings and account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.security.twoFactor}
                  onCheckedChange={(checked) => handleSettingChange('security', 'twoFactor', checked)}
                />
                {settings.security.twoFactor && <Badge variant="secondary">Enabled</Badge>}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Login Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
              </div>
              <Switch 
                checked={settings.security.loginAlerts}
                onCheckedChange={(checked) => handleSettingChange('security', 'loginAlerts', checked)}
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
              <div className="px-3">
                <Slider
                  value={[settings.security.sessionTimeout]}
                  onValueChange={([value]) => handleSettingChange('security', 'sessionTimeout', value)}
                  max={120}
                  min={15}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>15 min</span>
                  <span>{settings.security.sessionTimeout} minutes</span>
                  <span>2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your experience and interface preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Theme</Label>
                <Select 
                  value={settings.preferences.theme} 
                  onValueChange={(value) => handleSettingChange('preferences', 'theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base">Language</Label>
                <Select 
                  value={settings.preferences.language} 
                  onValueChange={(value) => handleSettingChange('preferences', 'language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="uz">O'zbek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">Play sounds for interactions and notifications</p>
              </div>
              <Switch 
                checked={settings.preferences.soundEffects}
                onCheckedChange={(checked) => handleSettingChange('preferences', 'soundEffects', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-save</Label>
                <p className="text-sm text-muted-foreground">Automatically save form data as you type</p>
              </div>
              <Switch 
                checked={settings.preferences.autoSave}
                onCheckedChange={(checked) => handleSettingChange('preferences', 'autoSave', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data or delete your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Export Account Data</h4>
              <p className="text-sm text-muted-foreground">Download a copy of all your account data</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}