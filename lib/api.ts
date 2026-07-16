import { NextResponse, type NextRequest } from "next/server";

export async function readJson(request: NextRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
