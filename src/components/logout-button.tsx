"use client";

import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-mute hover:text-cream"
      onClick={async () => {
        await api("/api/auth/logout", {});
        router.replace("/login");
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
