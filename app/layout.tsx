import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "سند",
  description: "نظام إدارة تذاكر دعم تقنية المعلومات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased" style={{ background: "#080820" }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              direction:  "rtl",
              fontFamily: "inherit",
              fontWeight: "500",
              fontSize:   "14px",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              maxWidth: "360px",
            },
            success: {
              style: {
                background:  "rgba(124,58,237,0.12)",
                color:       "#5B21B6",
                border:      "1px solid #7C3AED",
              },
              iconTheme: { primary: "#7C3AED", secondary: "#fff" },
            },
            error: {
              style: {
                background: "#fee2e2",
                color:      "#b91c1c",
                border:     "1px solid #f87171",
              },
              iconTheme: { primary: "#dc2626", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
