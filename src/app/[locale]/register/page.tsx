
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Mail, KeyRound, User as UserIcon, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import type { Locale } from '@/lib/i1n-config';

import enMessages from '@/dictionaries/en.json';
import ruMessages from '@/dictionaries/ru.json';
import uzMessages from '@/dictionaries/uz.json';

type Dictionary = typeof enMessages;
type RegisterPageDictionary = Dictionary['registerPage'];

const dictionaries: Record<Locale, Dictionary> = {
  en: enMessages,
  ru: ruMessages,
  uz: uzMessages,
};

const getRegisterDictionary = (locale: Locale): RegisterPageDictionary => {
  return dictionaries[locale]?.registerPage || dictionaries.en.registerPage;
};


export default function RegisterPage() {
  const { toast } = useToast(); // Keep for potential non-auth related toasts
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale || 'uz';
  const dictionary = getRegisterDictionary(locale);

  const { registerStep1, registerStep2, confirmAccount, isLoading, registrationData } = useAuth();
  
  // Determine initial step based on registrationData from context
  const getInitialStep = () => {
    if (registrationData?.isRegistered && !registrationData?.isConfirmed) return 3;
    if (registrationData?.email && registrationData?.password) return 2; // Assumes password was set in step 1
    return 1;
  };
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  
  const [email, setEmail] = useState(registrationData?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState(registrationData?.firstName || "");
  const [lastName, setLastName] = useState(registrationData?.lastName || "");
  
  const totalSteps = 3;
  const progressValue = (currentStep / totalSteps) * 100;

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await registerStep1(email, password, confirmPassword); 
    if (success) {
      setCurrentStep(2);
    }
    // Toasts for errors are handled in AuthContext
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await registerStep2(firstName, lastName);
    if (success) {
      setCurrentStep(3);
    }
  };
  
  const handleConfirm = async () => {
    await confirmAccount(); // AuthContext shows toasts and redirects
  };

  const goBack = () => {
    if(currentStep === 2 && registrationData) {
        // If going back from step 2, clear password fields for re-entry
        setPassword("");
        setConfirmPassword("");
    }
    if(currentStep > 1) setCurrentStep(currentStep - 1);
  }


  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{dictionary.createAccountTitle}</CardTitle>
          <CardDescription>{dictionary.createAccountDesc}</CardDescription>
           <Progress value={progressValue} className="w-full mt-2" />
           <p className="text-sm text-muted-foreground mt-1">{dictionary.step.replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}</p>
        </CardHeader>

        <CardContent>
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label htmlFor="email-register" className="block text-sm font-medium text-foreground mb-1">{dictionary.emailLabel}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email-register" type="email" placeholder={dictionary.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div>
                <label htmlFor="password-register" className="block text-sm font-medium text-foreground mb-1">{dictionary.passwordLabel}</label>
                 <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password-register" type={showPassword ? "text" : "password"} placeholder={dictionary.passwordCreatePlaceholder} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pl-10 pr-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password-register" className="block text-sm font-medium text-foreground mb-1">{dictionary.confirmPasswordLabel}</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="confirm-password-register" type={showConfirmPassword ? "text" : "password"} placeholder={dictionary.confirmPasswordPlaceholder} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="pl-10 pr-10" />
                   <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? dictionary.processingButton : dictionary.nextDetailsButton} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">{dictionary.firstNameLabel}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="firstName" type="text" placeholder={dictionary.firstNamePlaceholder} value={firstName} onChange={e => setFirstName(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">{dictionary.lastNameLabel}</label>
                 <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="lastName" type="text" placeholder={dictionary.lastNamePlaceholder} value={lastName} onChange={e => setLastName(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={goBack} className="w-1/2" disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {dictionary.backButton}
                </Button>
                <Button type="submit" className="w-1/2" disabled={isLoading}>
                  {isLoading ? dictionary.processingButton : dictionary.nextConfirmButton} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}
          
          {currentStep === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">{dictionary.almostThereTitle}</h3>
              <p className="text-muted-foreground">
                {dictionary.confirmAccountInstruction}
              </p>
              <p className="text-sm text-muted-foreground">{dictionary.registeredEmailLabel} <strong>{registrationData?.email}</strong></p>
               <div className="flex space-x-2 pt-2">
                 <Button type="button" variant="outline" onClick={goBack} className="w-1/2" disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {dictionary.backButton}
                 </Button>
                <Button onClick={handleConfirm} className="w-1/2" disabled={isLoading}>
                  {isLoading ? dictionary.confirmingButton : dictionary.confirmAccountButton}
                </Button>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm">
          <p>
            {dictionary.alreadyHaveAccount}{" "}
            <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
              {dictionary.signInLink}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
