import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/", "page");
  console.log("[REVALIDATE] 홈 페이지 캐시 무효화:", new Date().toISOString());

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}
