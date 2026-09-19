import { NextResponse } from "next/server";
import { listMenu, upsertMenuItem } from "@/lib/db";

export async function GET() {
  try {
    const data = await listMenu();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load menu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.categoryId || body.price == null) {
      return NextResponse.json({ error: "Name, category, and price are required." }, { status: 400 });
    }
    const item = await upsertMenuItem({
      id: body.id,
      name: String(body.name),
      categoryId: String(body.categoryId),
      price: Number(body.price),
      available: body.available !== false,
    });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
