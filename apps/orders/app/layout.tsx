import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GlobalFooter } from "@yet-a-ecommerce/ui";
import { GlobalHeader } from "./_components/GlobalHeader";

export const metadata: Metadata = {
  title: "Orders | Yet-A-Ecommerce",
  description: "View and manage your orders",
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={bodyStyle}>
        <GlobalHeader />
        <main style={mainStyle}>{children}</main>
        <GlobalFooter />
      </body>
    </html>
  );
}
