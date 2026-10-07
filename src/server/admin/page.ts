import "server-only";
import { redirect } from "next/navigation";
import { getAdmin } from "./auth";

/** Every admin page calls this (layouts alone don't re-check on client navigation). */
export async function pageAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
