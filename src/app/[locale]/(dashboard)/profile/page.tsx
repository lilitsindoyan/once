import { ArrowRight, CircleUserRound, Mail, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/capitals";
import { pageUser } from "@/server/guard";
import { PageHeading } from "@/components/portal/kit";
import { initials } from "@/components/portal/top-bar";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

/** Flow 6 — design frame 143. Phone number is replaced by email (v1.2). */
export default async function ProfilePage() {
  const user = await pageUser("/profile");
  const t = await getTranslations("profile");
  const tl = await getTranslations("login");
  const locale = await getLocale();

  const details: [string, string][] = [
    [tl("firstName"), user.firstName],
    [tl("lastName"), user.lastName],
    [t("country"), countryName(user.country, locale)],
    [t("email"), user.email],
  ];

  const card = (href: string, Icon: typeof Mail, title: string, text: string) => (
    <Link href={href} className="group flex gap-5 lg:gap-[clamp(8px,2.22vh,20px)] border border-[#2b241e] bg-[#0d0b09]/85 p-6 transition hover:border-copper/50 sm:p-7">
      <Icon className="size-7 shrink-0 text-copper" strokeWidth={1.2} />
      <span className="flex-1">
        <span className="block text-[15px] font-semibold tracking-[0.02em] text-white uppercase">{title}</span>
        <span className="mt-2 block text-[13px] leading-relaxed text-cream-2">{text}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-copper transition group-hover:translate-x-0.5" strokeWidth={1.4} />
    </Link>
  );

  return (
    <div className="max-w-[1000px]">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />

      <section className="mt-14 lg:mt-[clamp(22px,6.22vh,56px)] flex flex-col gap-10 lg:gap-[clamp(16px,4.44vh,40px)] sm:flex-row sm:items-center">
        <div className="flex flex-col items-center sm:w-[210px] sm:border-r sm:border-[#3b332c] sm:pr-10">
          <span className="grid size-[120px] place-items-center rounded-full border border-copper/70 bg-[radial-gradient(circle_at_30%_30%,rgba(178,118,73,0.35),rgba(20,12,8,0.9)_70%)] font-display text-[28px] text-white">
            {initials(user.firstName, user.lastName)}
          </span>
          <p className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)] text-center text-[17px] font-semibold tracking-[0.02em] text-white uppercase">
            {user.firstName} {user.lastName}
          </p>
        </div>
        <div>
          <h2 className="text-[13px] tracking-[0.24em] text-copper uppercase">{t("personalDetails")}</h2>
          <dl className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)] grid gap-4">
            {details.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-4">
                <dt className="text-[11px] tracking-[0.06em] text-copper-2 uppercase">{label}</dt>
                <dd className="text-[13px] break-all text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-12 lg:mt-[clamp(19px,5.33vh,48px)] grid gap-4 md:grid-cols-2">
        {card("/profile/edit", CircleUserRound, t("editTitle"), t("editText"))}
        {card("/profile/email", Mail, t("emailTitle"), t("emailText"))}
      </div>
      <div className="mt-4 flex gap-5 lg:gap-[clamp(8px,2.22vh,20px)] border border-[#2b241e] bg-[#0d0b09]/85 p-6 sm:p-7">
        <ShieldCheck className="size-7 shrink-0 text-copper" strokeWidth={1.2} />
        <div>
          <p className="text-[15px] font-semibold tracking-[0.02em] text-white uppercase">{t("secureTitle")}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-cream-2">{t("secureText")}</p>
        </div>
      </div>
    </div>
  );
}
