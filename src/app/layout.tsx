import type { Metadata } from "next";
import "./globals.css";
import "./journeys.css";
import "./typography.css";
import "./lab-workspace.css";
import { LayoutProvider } from "@/components/layout-preference";

export const metadata: Metadata = {
  title: "StatsConcepts — one concept at a time",
  description: "Learn forecasting and experimentation through interactive ecommerce stories, diagrams, and A/B testing playgrounds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" style={{ fontSize: "90%" }}><body><LayoutProvider>{children}</LayoutProvider></body></html>;
}
