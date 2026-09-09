import "./globals.css";

export const metadata = {
  title: "Outreach 360 CRM",
  description: "Leads, projects, invoices, and tasks for Outreach 360",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Outreach 360",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#1e73f0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
