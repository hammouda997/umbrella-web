import type { Metadata } from "next";
import { Manrope, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Umbrella Express",
  description: "Delivery operations platform",
};

const themeBootScript = `
(function(){
  try {
    var k='umbrella-theme';
    var t=localStorage.getItem(k);
    if(t!=='light'&&t!=='dark') t='light';
    var r=document.documentElement;
    if(t==='dark') r.classList.add('dark');
    else r.classList.remove('dark');
    r.dataset.theme=t;
    r.style.colorScheme=t;
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${sans.variable} ${display.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
