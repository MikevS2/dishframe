import type { Metadata } from "next";
import { AccountProvider } from "@/components/account-provider";
import { AppShell } from "@/components/app-shell";
import { NavigationGuardProvider } from "@/components/navigation-guard-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DishFrame",
  description:
    "Maak in een paar stappen een mooie receptkaart met slimme teksthulp en een passende afbeelding."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <AccountProvider>
          <NavigationGuardProvider>
            <AppShell>{children}</AppShell>
          </NavigationGuardProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
