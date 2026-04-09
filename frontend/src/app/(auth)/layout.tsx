'use client';

import { AuthLayout } from "@/components/AuthLayout";
import GoogleAuthProvider from "@/components/providers/google-auth-provider";

export default function RootAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GoogleAuthProvider>
      <AuthLayout>
        {children}
      </AuthLayout>
    </GoogleAuthProvider>
  );
}
