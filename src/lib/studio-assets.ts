import { randomUUID } from "crypto";
import { mkdir, readFile, rm, unlink, writeFile } from "fs/promises";
import path from "path";

export interface StudioLogoAsset {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

export interface StudioReferenceAsset {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface StudioAssetsManifest {
  logo: StudioLogoAsset | null;
  references: StudioReferenceAsset[];
}

export interface StudioAssetsSummary {
  logo: StudioLogoAsset | null;
  references: Array<StudioReferenceAsset & { url: string }>;
  logoUrl: string;
  logoSnippet: string;
}

interface StudioUserAssetPaths {
  rootDir: string;
  manifestPath: string;
  logoDir: string;
  referencesDir: string;
}

const MAX_LOGO_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_REFERENCE_FILE_SIZE = 30 * 1024 * 1024; // 30 MB
const STUDIO_LOGO_URL = "/api/studio/assets/logo";

const ALLOWED_LOGO_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".avif",
]);

function defaultManifest(): StudioAssetsManifest {
  return { logo: null, references: [] };
}

function getUserAssetPaths(userId: string): StudioUserAssetPaths {
  const rootDir = path.join(process.cwd(), "storage", "studio-assets", userId);
  return {
    rootDir,
    manifestPath: path.join(rootDir, "manifest.json"),
    logoDir: path.join(rootDir, "logo"),
    referencesDir: path.join(rootDir, "references"),
  };
}

async function ensureUserAssetDirs(userId: string) {
  const paths = getUserAssetPaths(userId);
  await mkdir(paths.logoDir, { recursive: true });
  await mkdir(paths.referencesDir, { recursive: true });
  return paths;
}

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function sanitizeFileName(fileName: string) {
  const normalized = normalizeWhitespace(fileName)
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .replace(/^\.+/, "")
    .trim();

  if (!normalized) return "arquivo";
  return normalized.slice(0, 120);
}

function sanitizeMimeType(input: string | null | undefined) {
  const value = (input ?? "").trim().toLowerCase();
  if (!value || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(value)) {
    return "application/octet-stream";
  }
  return value;
}

function inferExtension(fileName: string, fallback = ".bin") {
  const ext = path.extname(fileName).toLowerCase();
  if (!ext || ext.length > 10) return fallback;
  return ext;
}

function buildSafeReferenceStoredName(id: string, originalName: string) {
  const cleaned = sanitizeFileName(originalName);
  const ext = inferExtension(cleaned, "");
  const base = (ext ? cleaned.slice(0, -ext.length) : cleaned).trim() || "arquivo";
  const safeBase = base.replace(/\s+/g, "-").toLowerCase().slice(0, 60);
  return `${id}-${safeBase}${ext || ".bin"}`;
}

function sortReferencesNewestFirst(items: StudioReferenceAsset[]) {
  return [...items].sort((a, b) => {
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
}

async function readManifest(userId: string): Promise<StudioAssetsManifest> {
  const paths = getUserAssetPaths(userId);

  try {
    const raw = await readFile(paths.manifestPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StudioAssetsManifest> | null;

    const logo =
      parsed?.logo &&
      typeof parsed.logo === "object" &&
      typeof parsed.logo.originalName === "string" &&
      typeof parsed.logo.storedName === "string" &&
      typeof parsed.logo.mimeType === "string" &&
      typeof parsed.logo.size === "number" &&
      typeof parsed.logo.updatedAt === "string"
        ? parsed.logo
        : null;

    const references = Array.isArray(parsed?.references)
      ? parsed.references.filter((item): item is StudioReferenceAsset => {
          return (
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.originalName === "string" &&
            typeof item.storedName === "string" &&
            typeof item.mimeType === "string" &&
            typeof item.size === "number" &&
            typeof item.uploadedAt === "string"
          );
        })
      : [];

    return {
      logo,
      references: sortReferencesNewestFirst(references),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return defaultManifest();
    }

    throw error;
  }
}

async function writeManifest(userId: string, manifest: StudioAssetsManifest) {
  const paths = await ensureUserAssetDirs(userId);
  const nextManifest: StudioAssetsManifest = {
    logo: manifest.logo,
    references: sortReferencesNewestFirst(manifest.references),
  };

  await writeFile(paths.manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
}

function fileToSummary(manifest: StudioAssetsManifest): StudioAssetsSummary {
  return {
    logo: manifest.logo,
    logoUrl: STUDIO_LOGO_URL,
    logoSnippet: `<img src="${STUDIO_LOGO_URL}" alt="Logo da marca" />`,
    references: manifest.references.map((item) => ({
      ...item,
      url: `/api/studio/assets/references/${encodeURIComponent(item.id)}`,
    })),
  };
}

export async function getStudioAssetsSummary(userId: string) {
  const manifest = await readManifest(userId);
  return fileToSummary(manifest);
}

function assertLogoFile(file: File) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Arquivo de logo invalido.");
  }

  if (file.size <= 0) {
    throw new Error("A logo enviada esta vazia.");
  }

  if (file.size > MAX_LOGO_FILE_SIZE) {
    throw new Error("A logo excede o limite de 10 MB.");
  }

  const ext = inferExtension(file.name, "");
  const mimeType = sanitizeMimeType(file.type);
  const isImageMime = mimeType.startsWith("image/");
  if (!isImageMime && !ALLOWED_LOGO_EXTENSIONS.has(ext)) {
    throw new Error("A logo precisa ser um arquivo de imagem.");
  }
}

export async function saveStudioLogo(userId: string, file: File) {
  assertLogoFile(file);

  const paths = await ensureUserAssetDirs(userId);
  const manifest = await readManifest(userId);

  const originalName = sanitizeFileName(file.name);
  const ext = inferExtension(originalName, ".bin");
  const storedName = `logo${ext}`;
  const targetPath = path.join(paths.logoDir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (manifest.logo?.storedName && manifest.logo.storedName !== storedName) {
    const previousPath = path.join(paths.logoDir, manifest.logo.storedName);
    await unlink(previousPath).catch(() => undefined);
  }

  await writeFile(targetPath, buffer);

  manifest.logo = {
    originalName,
    storedName,
    mimeType: sanitizeMimeType(file.type),
    size: buffer.byteLength,
    updatedAt: new Date().toISOString(),
  };

  await writeManifest(userId, manifest);
  return fileToSummary(manifest);
}

export async function removeStudioLogo(userId: string) {
  const paths = await ensureUserAssetDirs(userId);
  const manifest = await readManifest(userId);

  if (manifest.logo?.storedName) {
    const targetPath = path.join(paths.logoDir, manifest.logo.storedName);
    await unlink(targetPath).catch(() => undefined);
  }

  manifest.logo = null;
  await writeManifest(userId, manifest);
  return fileToSummary(manifest);
}

function assertReferenceFile(file: File) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Arquivo de referencia invalido.");
  }

  if (file.size <= 0) {
    throw new Error(`O arquivo "${file.name || "sem nome"}" esta vazio.`);
  }

  if (file.size > MAX_REFERENCE_FILE_SIZE) {
    throw new Error(`O arquivo "${file.name || "sem nome"}" excede o limite de 30 MB.`);
  }
}

export async function saveStudioReferenceFiles(userId: string, files: File[]) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Selecione ao menos um arquivo de referencia.");
  }

  const validFiles = files.filter((file) => file.size > 0);
  if (validFiles.length === 0) {
    throw new Error("Nao ha arquivos validos para enviar.");
  }

  const paths = await ensureUserAssetDirs(userId);
  const manifest = await readManifest(userId);

  for (const file of validFiles) {
    assertReferenceFile(file);
    const id = randomUUID();
    const originalName = sanitizeFileName(file.name);
    const storedName = buildSafeReferenceStoredName(id, originalName);
    const targetPath = path.join(paths.referencesDir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(targetPath, buffer);

    manifest.references.push({
      id,
      originalName,
      storedName,
      mimeType: sanitizeMimeType(file.type),
      size: buffer.byteLength,
      uploadedAt: new Date().toISOString(),
    });
  }

  manifest.references = sortReferencesNewestFirst(manifest.references);
  await writeManifest(userId, manifest);
  return fileToSummary(manifest);
}

export async function readStudioLogoFile(userId: string) {
  const paths = getUserAssetPaths(userId);
  const manifest = await readManifest(userId);

  if (!manifest.logo?.storedName) {
    return null;
  }

  const filePath = path.join(paths.logoDir, manifest.logo.storedName);

  try {
    const buffer = await readFile(filePath);
    return {
      buffer,
      fileName: manifest.logo.originalName,
      mimeType: manifest.logo.mimeType || "application/octet-stream",
      size: manifest.logo.size,
      updatedAt: manifest.logo.updatedAt,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function readStudioReferenceFile(userId: string, id: string) {
  const paths = getUserAssetPaths(userId);
  const manifest = await readManifest(userId);
  const reference = manifest.references.find((item) => item.id === id);

  if (!reference) return null;

  const filePath = path.join(paths.referencesDir, reference.storedName);

  try {
    const buffer = await readFile(filePath);
    return {
      buffer,
      fileName: reference.originalName,
      mimeType: reference.mimeType || "application/octet-stream",
      size: reference.size,
      uploadedAt: reference.uploadedAt,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function deleteStudioReferenceFile(userId: string, id: string) {
  const paths = await ensureUserAssetDirs(userId);
  const manifest = await readManifest(userId);
  const reference = manifest.references.find((item) => item.id === id);

  if (!reference) {
    throw new Error("Arquivo de referencia nao encontrado.");
  }

  const filePath = path.join(paths.referencesDir, reference.storedName);
  await unlink(filePath).catch(() => undefined);

  manifest.references = manifest.references.filter((item) => item.id !== id);
  await writeManifest(userId, manifest);

  return fileToSummary(manifest);
}

export async function removeAllStudioAssetsForUser(userId: string) {
  const paths = getUserAssetPaths(userId);
  await rm(paths.rootDir, { force: true, recursive: true }).catch(() => undefined);
}
