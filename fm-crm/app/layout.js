import "./globals.css";

export const metadata = {
  title: "Freedom Masons CRM",
  description: "Leads, projects, invoices, and tasks for Freedom Masons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
