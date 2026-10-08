import { getCurrentUser } from "@/server/auth";
import { LandingChrome } from "@/components/landing/chrome";

/** Public pages next to the landing (Bottle Owners): same header and side menu as the landing. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="landing-glow min-h-dvh">
      <LandingChrome active="map" loggedIn={!!user} onLanding={false} />
      <main className="px-6 pt-28 pb-24 sm:px-12 sm:pt-36 lg:pr-[clamp(48px,5vw,80px)] lg:pl-[clamp(200px,16vw,256px)]">{children}</main>
    </div>
  );
}
