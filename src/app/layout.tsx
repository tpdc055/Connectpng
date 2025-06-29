import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import { SetupChecker } from "@/components/SetupChecker";

export const metadata: Metadata = {
  title: "Infrastructure Monitoring System",
  description: "Universal infrastructure monitoring and project management platform - completely configurable for any organization worldwide",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SystemSettingsProvider>
          <AuthProvider>
            <SetupChecker>
              {children}
            </SetupChecker>
          </AuthProvider>
        </SystemSettingsProvider>
      </body>
    </html>
  );
}
