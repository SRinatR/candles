
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react"; // Added Eye, EyeOff
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import React, { useEffect, useState } from 'react'; // Added useState


const managerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

export default function NewManagerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { isAdmin, addManager, isLoading: isAdminAuthLoading } = useAdminAuth(); // Renamed isLoading to avoid conflict
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (!isAdminAuthLoading && !isAdmin) { // Check isAdminAuthLoading
      router.replace('/admin/dashboard');
    }
  }, [isAdmin, router, isAdminAuthLoading]);


  const onSubmit = async (data: ManagerFormValues) => {
    const success = await addManager(data.name, data.email, data.password); 
    if (success) {
        // Toast message for success is handled in addManager
        router.push("/admin/users");
    } 
    // Toast for failure (e.g. email exists) will be handled by addManager in context
  };
  
  if (isAdminAuthLoading) { // Check isAdminAuthLoading
      return <div className="flex justify-center items-center min-h-[300px]"><p>Loading...</p></div>;
  }
  if (!isAdmin) {
      return <div className="flex justify-center items-center min-h-[300px]"><p>Access Denied. Redirecting...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Manager</h1>
            <p className="text-muted-foreground">Create a new manager account.</p>
        </div>
        <Button variant="outline" asChild>
            <Link href="/admin/users">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to User Management
            </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Manager Account Details</CardTitle>
            <CardDescription>Fill in the information for the new manager.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Jane Doe" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} placeholder="manager@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    {...register("password")} 
                    placeholder="••••••••" 
                    className="pr-10"
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
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting || isAdminAuthLoading}>
            <UserPlus className="mr-2 h-4 w-4" /> 
            {isSubmitting ? "Adding..." : "Add Manager (Simulated)"}
          </Button>
        </div>
      </form>
      <p className="text-sm text-muted-foreground text-center pt-4">
          Note: Manager creation is simulated using localStorage and will persist only for this browser session.
        </p>
    </div>
  );
}
