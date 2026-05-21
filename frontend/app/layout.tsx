import "./globals.css";
import type { ReactNode } from "react";
import { Layout } from "../components/Layout";

export const metadata = {
  title: "MedDataGuard",
  description: "Medical CV dataset QA, leakage, and drift auditor"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

