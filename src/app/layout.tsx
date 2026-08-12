import type { Metadata } from "next";
import { AppProviders } from "@/contexts/app-settings";
import { LocaleProvider } from "@/contexts/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Robot Builder",
  description: "From Robot Idea to Working Machine",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProviders>
          <LocaleProvider>{children}</LocaleProvider>
        </AppProviders>
      </body>
    </html>
  );
}
