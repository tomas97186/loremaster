import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/db/auth";
import { MAX_UPLOAD_BYTES, MIME_TO_EXT, UPLOAD_DIR } from "@/lib/uploads";

export async function POST(request: Request) {
  if (!(await getCurrentUser())) {
    return Response.json({ error: "Non autenticato." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Nessun file ricevuto." }, { status: 400 });
  }

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return Response.json({ error: "Formato non supportato (PNG, JPG, WEBP, GIF)." }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "Il file supera i 10 MB." }, { status: 413 });
  }

  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));

  return Response.json({ url: `/api/files/${name}` });
}
