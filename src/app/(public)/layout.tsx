import { AuthLayout } from "@/components/auth/auth-layout";

export default function PublicAuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthLayout>{children}</AuthLayout>;
}
