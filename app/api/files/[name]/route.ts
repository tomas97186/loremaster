import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/db/auth";
import { EXT_TO_MIME, STORED_NAME, UPLOAD_DIR } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getCurrentUser())) return new Response("Non autenticato.", { status: 401 });

  const { name } = await params;
  if (!STORED_NAME.test(name)) return new Response("Non trovato.", { status: 404 });

  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": EXT_TO_MIME[name.split(".").pop()!],
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Non trovato.", { status: 404 });
  }
}
