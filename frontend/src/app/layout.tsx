import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Система электронного обучения | Канбан",
  description: "Образовательная платформа с Канбан-доской",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800 dark:bg-[#181818] dark:text-[#ededed] transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
