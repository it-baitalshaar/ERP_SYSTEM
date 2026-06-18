import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not Found",
  robots: { index: false, follow: false, nocache: true },
};

export default function PlatformInitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
