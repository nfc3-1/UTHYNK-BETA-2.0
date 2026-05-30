import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getServerSessionUser();

  return NextResponse.json({
    authenticated: Boolean(user),
    user,
  });
}
