import { randomUUID } from "crypto";
import path from "path";
import { prisma } from "@/lib/prisma";

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

export interface StudioAssetsSummary {
  logo: StudioLogoAsset | null;
  references: Array<StudioReferenceAsset & { url: string }>;
  logoUrl: string;
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

function toStudioLogoAsset(record: {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  updatedAt: Date;
}): StudioLogoAsset {
  return {
    originalName: record.originalName,
    storedName: record.storedName,
    mimeType: record.mimeType,
    size: record.size,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toStudioReferenceAsset(record: {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}): StudioReferenceAsset {
  return {
    id: record.id,
    originalName: record.originalName,
    storedName: record.storedName,
    mimeType: record.mimeType,
    size: record.size,
    uploadedAt: record.uploadedAt.toISOString(),
  };
}

function toAssetsSummary(input: {
  logo: StudioLogoAsset | null;
  references: StudioReferenceAsset[];
}): StudioAssetsSummary {
  return {
    logo: input.logo,
    logoUrl: STUDIO_LOGO_URL,
    references: input.references.map((item) => ({
      ...item,
      url: `/api/studio/assets/references/${encodeURIComponent(item.id)}`,
    })),
  };
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

export async function getStudioAssetsSummary(userId: string) {
  const [logoRecord, referenceRecords] = await Promise.all([
    prisma.studioLogoAsset.findUnique({
      where: { userId },
      select: {
        originalName: true,
        storedName: true,
        mimeType: true,
        size: true,
        updatedAt: true,
      },
    }),
    prisma.studioReferenceAsset.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        originalName: true,
        storedName: true,
        mimeType: true,
        size: true,
        uploadedAt: true,
      },
    }),
  ]);

  return toAssetsSummary({
    logo: logoRecord ? toStudioLogoAsset(logoRecord) : null,
    references: referenceRecords.map(toStudioReferenceAsset),
  });
}

export async function saveStudioLogo(userId: string, file: File) {
  assertLogoFile(file);

  const originalName = sanitizeFileName(file.name);
  const ext = inferExtension(originalName, ".bin");
  const storedName = `logo${ext}`;
  const mimeType = sanitizeMimeType(file.type);
  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.studioLogoAsset.upsert({
    where: { userId },
    update: {
      originalName,
      storedName,
      mimeType,
      size: buffer.byteLength,
      content: buffer,
    },
    create: {
      userId,
      originalName,
      storedName,
      mimeType,
      size: buffer.byteLength,
      content: buffer,
    },
  });

  return getStudioAssetsSummary(userId);
}

export async function removeStudioLogo(userId: string) {
  await prisma.studioLogoAsset.deleteMany({
    where: { userId },
  });

  return getStudioAssetsSummary(userId);
}

export async function saveStudioReferenceFiles(userId: string, files: File[]) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Selecione ao menos um arquivo de referencia.");
  }

  const validFiles = files.filter((file) => file.size > 0);
  if (validFiles.length === 0) {
    throw new Error("Nao ha arquivos validos para enviar.");
  }

  const payloads = await Promise.all(
    validFiles.map(async (file) => {
      assertReferenceFile(file);
      const id = randomUUID();
      const originalName = sanitizeFileName(file.name);
      const storedName = buildSafeReferenceStoredName(id, originalName);
      const mimeType = sanitizeMimeType(file.type);
      const buffer = Buffer.from(await file.arrayBuffer());

      return {
        id,
        userId,
        originalName,
        storedName,
        mimeType,
        size: buffer.byteLength,
        content: buffer,
      };
    }),
  );

  await prisma.$transaction(
    payloads.map((data) =>
      prisma.studioReferenceAsset.create({
        data,
      }),
    ),
  );

  return getStudioAssetsSummary(userId);
}

export async function readStudioLogoFile(userId: string) {
  const logo = await prisma.studioLogoAsset.findUnique({
    where: { userId },
    select: {
      originalName: true,
      mimeType: true,
      size: true,
      updatedAt: true,
      content: true,
    },
  });

  if (!logo) return null;

  return {
    buffer: Buffer.from(logo.content),
    fileName: logo.originalName,
    mimeType: logo.mimeType || "application/octet-stream",
    size: logo.size,
    updatedAt: logo.updatedAt.toISOString(),
  };
}

export async function readStudioReferenceFile(userId: string, id: string) {
  const file = await prisma.studioReferenceAsset.findFirst({
    where: { id, userId },
    select: {
      originalName: true,
      mimeType: true,
      size: true,
      uploadedAt: true,
      content: true,
    },
  });

  if (!file) return null;

  return {
    buffer: Buffer.from(file.content),
    fileName: file.originalName,
    mimeType: file.mimeType || "application/octet-stream",
    size: file.size,
    uploadedAt: file.uploadedAt.toISOString(),
  };
}

export async function deleteStudioReferenceFile(userId: string, id: string) {
  const result = await prisma.studioReferenceAsset.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    throw new Error("Arquivo de referencia nao encontrado.");
  }

  return getStudioAssetsSummary(userId);
}

export async function removeAllStudioAssetsForUser(userId: string) {
  await prisma.$transaction([
    prisma.studioReferenceAsset.deleteMany({ where: { userId } }),
    prisma.studioLogoAsset.deleteMany({ where: { userId } }),
  ]);
}
