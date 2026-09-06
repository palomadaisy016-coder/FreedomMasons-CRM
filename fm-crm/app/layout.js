import "./globals.css";
export const metadata = {
  title: "Outreach 360 CRM",
  description: "Leads, projects, invoices, and tasks for Outreach 360",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
