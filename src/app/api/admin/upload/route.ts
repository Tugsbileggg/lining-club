import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

/** Kept in sync with the `isValidImage()` guard in storage.rules. */
const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** Node's File global is not guaranteed on every runtime; duck-type instead. */
function isUploadedFile(value: FormDataEntryValue): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const files = form.getAll("files").filter(isUploadedFile);
    if (files.length === 0) {
      return NextResponse.json({ error: "Зураг сонгогдоогүй байна" }, { status: 400 });
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      console.error("[api/upload] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is unset");
      return NextResponse.json(
        { error: "Storage тохируулагдаагүй байна" },
        { status: 500 },
      );
    }
    const bucket = adminStorage().bucket(bucketName);

    const urls: string[] = [];
    for (const file of files) {
      const extension = EXTENSIONS[file.type];
      if (!extension) {
        return NextResponse.json(
          { error: `Дэмжигдэхгүй файл: ${file.name}` },
          { status: 415 },
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `${file.name} хэт том байна (дээд тал нь 8MB)` },
          { status: 413 },
        );
      }

      // Firebase serves objects through a download token rather than a public
      // ACL, so this works on buckets with uniform bucket-level access.
      const token = randomUUID();
      const objectPath = `products/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

      await bucket.file(objectPath).save(Buffer.from(await file.arrayBuffer()), {
        resumable: false,
        metadata: {
          contentType: file.type,
          // Object paths are unique per upload and never overwritten, so the
          // bytes are immutable. Without this Firebase serves no max-age and
          // every layer downstream re-fetches the original on its own schedule.
          cacheControl: "public, max-age=31536000, immutable",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

      urls.push(
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`,
      );
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (err) {
    console.error("[api/upload] failed:", err);
    return NextResponse.json({ error: "Байршуулахад алдаа гарлаа" }, { status: 500 });
  }
}
