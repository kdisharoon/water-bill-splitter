import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminSession } from "@/lib/auth/check";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminSession();
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    await prisma.monthRecord.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete record:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
