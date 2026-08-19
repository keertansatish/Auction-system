import "./globals.css";
import SiteShell from "./site-shell";

export const metadata = {
  title: "MyAuction",
  description: "Create listings, track auction activity, and review seller analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
