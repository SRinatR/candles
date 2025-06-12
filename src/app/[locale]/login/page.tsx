
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams, useParams } from "next/navigation"; 
import { Logo } from "@/components/icons/Logo";
import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { Chrome, Send, Globe, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import type { Locale } from '@/lib/i1n-config';

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;
type LoginPageDictionary = Dictionary['loginPage'];

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getLoginDictionary = (locale: Locale): LoginPageDictionary => {
  return dictionaries[locale]?.loginPage || dictionaries.en.loginPage;
};


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeParams = useParams(); 
  const locale = routeParams.locale as Locale || 'uz';
  const dictionary = getLoginDictionary(locale);

  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { login: simulatedLogin, currentUser: simulatedUser, isLoading: isLoadingSimulatedAuth } = useAuth(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingSocial, setIsSubmittingSocial] = React.useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/account`;

  useEffect(() => {
    if (nextAuthStatus === "authenticated" || simulatedUser) {
      router.push(callbackUrl); 
    }
  }, [nextAuthStatus, simulatedUser, router, callbackUrl, locale]);

  const handleSocialSignIn = async (provider: string) => {
    setIsSubmittingSocial(provider);
    try {
      if (provider !== "google") { 
        toast({
          title: dictionary.loginComingSoonTitle,
          description: dictionary.loginComingSoonDesc.replace('{provider}', provider.charAt(0).toUpperCase() + provider.slice(1)),
        });
        setIsSubmittingSocial("");
        return;
      }
      const result = await signIn(provider, { callbackUrl });
      if (result?.error) {
        toast({
          title: dictionary.loginFailedTitle,
          description: result.error || dictionary.loginFailedDescGeneric,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sign in error", error);
      toast({
        title: dictionary.loginFailedTitle,
        description: dictionary.loginFailedDescGeneric,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSocial("");
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmail(true);
    const loginSuccess = await simulatedLogin(email, password); 
    if(loginSuccess) {
        router.push(callbackUrl);
    }
    // Toasts for login failure are handled within simulatedLogin
    setIsSubmittingEmail(false);
  };
  
  if (nextAuthStatus === "loading" || isLoadingSimulatedAuth || nextAuthSession || simulatedUser) {
    return <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center"><p>{dictionary.loading}</p></div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <Link href={`/${locale}/`} className="inline-block mx-auto mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl font-bold">{dictionary.signInTitle}</CardTitle>
          <CardDescription>{dictionary.signInDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">{dictionary.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder={dictionary.emailPlaceholder} 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password-login" className="block text-sm font-medium text-foreground mb-1">{dictionary.passwordLabel}</label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  id="password-login" 
                  type={showPassword ? "text" : "password"}
                  placeholder={dictionary.passwordPlaceholder} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pl-10 pr-10" 
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmittingEmail || isLoadingSimulatedAuth}>
              {isSubmittingEmail ? dictionary.signingInButton : dictionary.signInWithEmailButton}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {dictionary.orContinueWith}
              </span>
            </div>
          </div>
          
          <Button 
            onClick={() => handleSocialSignIn("google")} 
            className="w-full" 
            disabled={!!isSubmittingSocial || isSubmittingEmail}
            variant="outline"
          >
            <Chrome className="mr-2 h-5 w-5" /> 
            {isSubmittingSocial === "google" ? dictionary.signingInButton : dictionary.signInWithGoogle}
          </Button>
           <Button 
            onClick={() => handleSocialSignIn("telegram")} 
            className="w-full" 
            disabled={!!isSubmittingSocial || isSubmittingEmail}
            variant="outline"
          >
            <Send className="mr-2 h-5 w-5" /> 
            {isSubmittingSocial === "telegram" ? dictionary.processingButton : dictionary.signInWithTelegram}
          </Button>
          <Button 
            onClick={() => handleSocialSignIn("yandex")} 
            className="w-full" 
            disabled={!!isSubmittingSocial || isSubmittingEmail}
            variant="outline"
          >
            <Globe className="mr-2 h-5 w-5" /> 
            {isSubmittingSocial === "yandex" ? dictionary.processingButton : dictionary.signInWithYandex}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 text-sm">
           <p>
            {dictionary.dontHaveAccount}{" "}
            <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
              {dictionary.signUpLink}
            </Link>
          </p>
          <p className="text-muted-foreground text-xs px-4 text-center">
            {dictionary.termsAgree}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
