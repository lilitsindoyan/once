import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVariables } from "../fonts";
import { SiteHeader } from "@/components/site-header";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "ONCE", template: "%s · ONCE" },
  robots: { index: false }, // portal pages are private
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-screen">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
