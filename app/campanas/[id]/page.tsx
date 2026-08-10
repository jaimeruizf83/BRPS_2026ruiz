import { redirect } from "next/navigation";

export default async function LegacyApplicationRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/aplicaciones/${id}`);
}
