import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "بوابة تذاكر IT",
  description: "نظام إدارة تذاكر دعم تقنية المعلومات",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-slate-50">
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
                background:  "#e0f1d0",
                color:       "#00805b",
                border:      "1px solid #6fb54a",
              },
              iconTheme: { primary: "#6fb54a", secondary: "#fff" },
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
