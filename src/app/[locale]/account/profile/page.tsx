
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, Shield, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { UserProfileForm } from "@/components/forms/UserProfileForm";

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

export default function ProfilePage() {
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
    middleName: simulatedUser?.middleName || nextAuthSession?.user?.middleName || '',
    email: simulatedUser?.email || nextAuthSession?.user?.email || 'user@example.com',
    phone: simulatedUser?.phone || null,
    image: simulatedUser?.image || nextAuthSession?.user?.image || null,
    emailVerified: simulatedUser?.isConfirmed || !!nextAuthSession?.user?.emailVerified,
    createdAt: simulatedUser?.createdAt || new Date(),
    role: 'USER',
    newsletter: simulatedUser?.newsletter || false
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Update your personal information and preferences
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Keep your profile information up to date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm
              initialData={{
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                middleName: user.middleName || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth?.toISOString() || '',
                gender: user.gender || undefined,
                language: user.language,
                newsletter: user.newsletter
              }}
              onSuccess={() => {
                // Optionally redirect or show success message
                window.location.reload();
              }}
            />
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>
              Your account verification and security status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Member Since</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
