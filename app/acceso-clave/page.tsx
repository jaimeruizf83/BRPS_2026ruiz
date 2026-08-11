import { redirect } from "next/navigation";
import { safeRelativeReturnPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function PasswordAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const query = await searchParams;
  const returnTo = safeRelativeReturnPath(query.return_to || "/dashboard");
  const params = new URLSearchParams({ return_to: returnTo });
  if (query.error) params.set("error", query.error);
  redirect(`/?${params.toString()}`);
}
