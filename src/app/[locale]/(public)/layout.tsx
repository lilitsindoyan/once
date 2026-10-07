import { SiteHeader } from "@/components/site-header";

/** Public pages that sit outside the portal frame (Bottle Owners). */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">{children}</main>
    </>
  );
}
