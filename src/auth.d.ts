
// To extend the default NextAuth session/user types
// https://next-auth.js.org/getting-started/typescript

import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id?: string | null; // Add your custom properties here
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    // Add your custom properties here
    // id: string; // Example: if your User model has an id
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    userId?: string; // Example: if you add userId to token
  }
}
