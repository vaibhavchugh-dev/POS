import { PosCounter } from "@/components/pos-counter";
import { readTicket } from "@/app/actions";
import { listBills, listMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; dialog?: string; bill?: string }>;
}) {
  const params = await searchParams;
  const [menu, ticket, bills] = await Promise.all([
    listMenu(),
    readTicket(),
    listBills(),
  ]);
  const receipt = bills.find((b) => b.id === params.bill) ?? null;

  return (
    <PosCounter
      menu={menu}
      ticket={ticket}
      categoryId={params.category ?? "all"}
      dialog={params.dialog ?? null}
      bills={bills}
      receipt={receipt}
    />
  );
}
