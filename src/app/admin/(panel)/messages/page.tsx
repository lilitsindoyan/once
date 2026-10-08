import clsx from "clsx";
import { listMessages } from "@/server/admin/messages";
import { pageAdmin } from "@/server/admin/page";
import { messageReadAction } from "../../actions";
import { AButton, ALink, Flash, fmtDateTime, PageHeader, Pager } from "@/components/admin/kit";

export const metadata = { title: "Messages" };

/** Messages sent from the landing Contact form. */
export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; page?: string; unread?: string }> }) {
  await pageAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const unreadOnly = sp.unread === "1";
  const data = await listMessages(page, unreadOnly);
  const back = `/admin/messages?page=${page}${unreadOnly ? "&unread=1" : ""}`;

  return (
    <>
      <PageHeader
        title="Messages"
        sub={`From the website Contact form. ${data.unread} unread.`}
        actions={
          unreadOnly ? <ALink href="/admin/messages">Show all</ALink> : <ALink href="/admin/messages?unread=1">Unread only</ALink>
        }
      />
      <Flash ok={sp.ok} err={sp.err} />
      {data.rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-mute)]">No messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.rows.map((m) => (
            <li
              key={m.id}
              className={clsx(
                "rounded-lg border bg-white p-4",
                m.readAt ? "border-[var(--admin-border)]" : "border-[var(--admin-accent)]/50 shadow-sm",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={clsx("text-sm", !m.readAt && "font-semibold")}>
                    {m.name}{" "}
                    <a href={`mailto:${m.email}`} className="font-normal text-[var(--admin-accent)] hover:underline">
                      {m.email}
                    </a>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--admin-mute)]">
                    {fmtDateTime(m.createdAt)} · {m.locale.toUpperCase()}
                  </p>
                </div>
                <form action={messageReadAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.readAt ? "0" : "1"} />
                  <input type="hidden" name="back" value={back} />
                  <AButton type="submit" variant="secondary">
                    {m.readAt ? "Mark unread" : "Mark read"}
                  </AButton>
                </form>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
      <Pager page={data.page} pages={data.pages} href={(p) => `/admin/messages?page=${p}${unreadOnly ? "&unread=1" : ""}`} />
    </>
  );
}
