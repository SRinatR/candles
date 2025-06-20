"use client";

import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i1n-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Shield, Bell, Globe, Trash2, Download, User, Calendar, ShoppingBag, Mail, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PasswordChangeForm } from "@/components/forms/PasswordChangeForm";

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en;
};

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as Locale) || 'uz';
  
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useAuth();
  
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAuthenticated = !!nextAuthSession || !!simulatedUser;
  const isLoadingAuth = nextAuthStatus === "loading" || isLoadingSimulatedAuth;
  
  useEffect(() => {
    const dictionary = getDictionary(locale);
    setDict(dictionary);
  }, [locale]);
  
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    } else if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isLoadingAuth, isAuthenticated, router, locale]);
  
  if (isLoadingAuth || isLoading || !dict) {
    return <div className="flex justify-center items-center min-h-[300px]"><p>Loading...</p></div>;
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  // Mock user data for demonstration
   const user = {
     id: simulatedUser?.id || nextAuthSession?.user?.id || '1',
     firstName: simulatedUser?.firstName || nextAuthSession?.user?.firstName || 'User',
     lastName: simulatedUser?.lastName || nextAuthSession?.user?.lastName || '',
     email: simulatedUser?.email || nextAuthSession?.user?.email || 'user@example.com',
     newsletter: simulatedUser?.newsletter || false,
     language: locale,
     emailVerified: simulatedUser?.isConfirmed || !!nextAuthSession?.user?.emailVerified,
     createdAt: simulatedUser?.createdAt || new Date(),
     role: 'USER',
     accounts: [],
     _count: { orders: 0 }
   };
 
   const isOAuthUser = user.accounts.length > 0;
  const hasPassword = !isOAuthUser;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Account Settings
        </h1>
        <p className="text-gray-600">
          Manage your account security and preferences
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasPassword ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <PasswordChangeForm />
              </div>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">OAuth Authentication</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Your account is secured through {user.accounts[0]?.provider} authentication. 
                  Password changes are managed through your {user.accounts[0]?.provider} account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Address</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div>
                      {user.emailVerified ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Account Type</h4>
                      <p className="text-sm text-gray-600 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    <Badge variant="outline">
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Member Since</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                      <div>
                        <h4 className="font-medium">Total Orders</h4>
                        <p className="text-sm text-gray-600">{user._count.orders}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <h4 className="font-medium">Email Verification</h4>
                    <p className="text-sm text-gray-600">
                      {user.emailVerified 
                        ? 'Your email address has been verified' 
                        : 'Please check your email to verify your account'
                      }
                    </p>
                  </div>
                </div>
                <div>
                  {user.emailVerified ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm">
                      Resend Verification
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>
              Manage your data and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Newsletter Subscription</h4>
                <p className="text-sm text-gray-600">
                  {user.newsletter 
                    ? 'You are subscribed to our newsletter' 
                    : 'You are not subscribed to our newsletter'
                  }
                </p>
              </div>
              <Link href={`/${locale}/account/profile`}>
                <Button variant="outline" size="sm">
                  Manage Preferences
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-gray-600">
                  Download a copy of your account data
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}