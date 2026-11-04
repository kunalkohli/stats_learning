import type { Metadata } from "next";
import "./globals.css";
import "./journeys.css";
import "./typography.css";
import "./lab-workspace.css";
import "./sql-practice.css";
import "./lesson-teaching.css";
import "./focused-learning.css";
import { LayoutProvider } from "@/components/layout-preference";

export const metadata: Metadata = {
  title: "DSConcepts — learn it, then try it",
  description: "Learn forecasting, experimentation, and SQL through interactive ecommerce stories and hands-on interview practice.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" style={{ fontSize: "90%" }}><body><LayoutProvider>{children}</LayoutProvider></body></html>;
}
