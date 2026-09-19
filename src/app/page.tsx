import { PosApp } from "@/components/pos-app";
import { listMenu } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialMenu = await listMenu();
  return <PosApp initialMenu={initialMenu} />;
}
