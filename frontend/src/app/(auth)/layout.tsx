'use client';

import { AuthLayout } from "@/components/AuthLayout";

export default function RootAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLayout>
      {children}
    </AuthLayout>
  );
}
