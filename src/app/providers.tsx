
"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider as SimulatedAuthProvider } from "@/contexts/AuthContext";
// AdminAuthProvider is applied specifically in admin layouts/pages

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SimulatedAuthProvider>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </SimulatedAuthProvider>
    </SessionProvider>
  );
}
