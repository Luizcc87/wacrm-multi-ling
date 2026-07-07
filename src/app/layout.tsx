import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DEFAULT_MODE, DEFAULT_THEME, STORAGE_KEY, MODE_STORAGE_KEY, THEME_IDS, MODES } from "@/lib/themes";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var themeKey = ${JSON.stringify(STORAGE_KEY)};
    var modeKey = ${JSON.stringify(MODE_STORAGE_KEY)};
    var defaultTheme = ${JSON.stringify(DEFAULT_THEME)};
    var defaultMode = ${JSON.stringify(DEFAULT_MODE)};
    var themes = ${JSON.stringify(THEME_IDS)};
    var modes = ${JSON.stringify(MODES)};
    var savedTheme = localStorage.getItem(themeKey);
    var savedMode = localStorage.getItem(modeKey);
    var theme = themes.indexOf(savedTheme) !== -1 ? savedTheme : defaultTheme;
    var mode = modes.indexOf(savedMode) !== -1 ? savedMode : defaultMode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
  } catch (_e) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
    document.documentElement.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      data-mode={DEFAULT_MODE}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
