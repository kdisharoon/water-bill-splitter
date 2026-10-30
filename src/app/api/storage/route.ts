import { NextResponse } from "next/server";
import { uploadObject, getPresignedUrl, deleteObject } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const billingMonth = (formData.get("billingMonth") as string) || "general";
    const category = (formData.get("category") as string) || "doc";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop() || "bin";
    const safeKey = `${billingMonth}/${category}-${Date.now()}.${extension}`;

    await uploadObject(safeKey, buffer, file.type || "application/octet-stream");
    const presignedUrl = await getPresignedUrl(safeKey, 86400); // 24hr presigned URL

    return NextResponse.json({
      success: true,
      key: safeKey,
      url: presignedUrl,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Storage upload failed:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing file key parameter" }, { status: 400 });
    }

    const url = await getPresignedUrl(key, 3600);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return NextResponse.json({ error: "Failed to get download URL" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing file key parameter" }, { status: 400 });
    }

    await deleteObject(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete object:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
