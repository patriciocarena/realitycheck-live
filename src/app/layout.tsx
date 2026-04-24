import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RealityCheck Live",
  description: "Voice-first startup idea reality check agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
