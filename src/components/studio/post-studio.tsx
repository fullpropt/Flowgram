"use client";

import { type ChangeEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Download, FolderOpen, Pencil, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StudioPresetKey = "feedPortrait" | "feedSquare" | "story";

interface StudioPreset {
  key: StudioPresetKey;
  label: string;
  width: number;
  height: number;
}

interface StudioLibraryItem {
  id: string;
  name: string;
  content: string;
  updatedAt: number;
}

interface StudioLogoAsset {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  updatedAt: string;
}

interface StudioReferenceAsset {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  url: string;
}

interface StudioAssetsResponse {
  logo: StudioLogoAsset | null;
  references: StudioReferenceAsset[];
  logoUrl: string;
}

const STUDIO_PRESETS: StudioPreset[] = [
  { key: "feedPortrait", label: "Feed 4:5 (1080x1350)", width: 1080, height: 1350 },
  { key: "feedSquare", label: "Feed 1:1 (1080x1080)", width: 1080, height: 1080 },
  { key: "story", label: "Story 9:16 (1080x1920)", width: 1080, height: 1920 },
];

const STUDIO_HTML_LIBRARY_KEY = "flowgram-lab:studio:html-library:v1";
const STUDIO_CSS_LIBRARY_KEY = "flowgram-lab:studio:css-library:v1";
const STUDIO_LOGO_FIXED_URL = "/api/studio/assets/logo";
const STUDIO_CANVAS_LOGO_GUARD_CSS = `
.studio-canvas-root .post__header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.studio-canvas-root .post__header > * {
  min-width: 0;
}
.studio-canvas-root img.brand-logo {
  display: block !important;
  width: 180px !important;
  height: 56px !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  object-fit: cover !important;
  object-position: center !important;
  position: relative !important;
  inset: auto !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
  margin: 0 !important;
  z-index: auto !important;
  flex: 0 0 180px !important;
  flex-shrink: 0 !important;
}
.studio-canvas-root .post__header > img.brand-logo + .post__badge-dot {
  display: none !important;
}
`;

const STUDIO_CANVAS_EXPORT_GUARD_CSS = `
.studio-canvas-root > * {
  border-radius: 0 !important;
}
`;
const STUDIO_LOGO_SRC_PATTERN =
  /(\bsrc\s*=\s*["'])(?:https?:\/\/[^"' ]+)?\/api\/studio\/assets\/logo(?:\?[^"']*)?(["'])/gi;

const DEFAULT_HTML = `<article class="post">
  <div class="post__glow post__glow--a"></div>
  <div class="post__glow post__glow--b"></div>

  <div class="post__layer">
    <header class="post__header">
      <div class="post__badge-dot"></div>
      <div>
        <p class="post__eyebrow">Tema do Post</p>
        <p class="post__meta">Estrutura visual neutra</p>
      </div>
    </header>

    <section class="post__hero">
      <h1 class="post__title">Headline forte em 2 linhas para o post</h1>
      <p class="post__subtitle">Subtexto curto com promessa, contexto ou explicacao da ideia principal.</p>
    </section>

    <section class="post__grid">
      <div class="post__panel">
        <p class="post__panel-label">Ponto 1</p>
        <h2 class="post__panel-title">Mensagem clara</h2>
        <ul class="post__list">
          <li>Texto curto e direto.</li>
          <li>Foco no beneficio.</li>
          <li>Leitura rapida no feed.</li>
        </ul>
      </div>

      <div class="post__panel">
        <p class="post__panel-label">Ponto 2</p>
        <h2 class="post__panel-title">Composicao visual</h2>
        <ul class="post__list">
          <li>Hierarquia tipografica.</li>
          <li>Espaco entre blocos.</li>
          <li>Contraste de informacao.</li>
        </ul>
      </div>
    </section>

    <footer class="post__footer">
      <p class="post__hook">Hook / CTA principal.</p>
      <p class="post__cta">Complemento de acao ou reforco final.</p>
    </footer>
  </div>
</article>`;

const DEFAULT_CSS = `.post {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at 18% 12%, rgba(148, 163, 184, 0.12), transparent 40%),
    radial-gradient(circle at 82% 14%, rgba(96, 165, 250, 0.10), transparent 36%),
    linear-gradient(160deg, #101521 0%, #111827 52%, #0f172a 100%);
  color: #f8fafc;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.post__glow {
  position: absolute;
  width: 38%;
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  filter: blur(40px);
  opacity: 0.4;
  pointer-events: none;
}

.post__glow--a {
  left: -8%;
  top: -4%;
  background: rgba(168, 85, 247, 0.35);
}

.post__glow--b {
  right: -10%;
  bottom: -8%;
  background: rgba(59, 130, 246, 0.28);
}

.post__layer {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 56px 52px 46px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.post__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post__badge-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, #e2e8f0, #94a3b8);
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.08);
  flex-shrink: 0;
}

.post__eyebrow {
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(241, 245, 249, 0.95);
  line-height: 1;
}

.post__meta {
  margin: 6px 0 0;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(191, 219, 254, 0.55);
}

.post__hero {
  margin-top: 30px;
}

.post__title {
  margin: 0;
  font-size: 88px;
  line-height: 0.92;
  letter-spacing: -0.045em;
  font-weight: 800;
  max-width: 92%;
  color: #f8fbff;
  text-wrap: balance;
}

.post__subtitle {
  margin: 16px 0 0;
  max-width: 88%;
  font-size: 29px;
  line-height: 1.14;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.9);
}

.post__grid {
  margin-top: 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.post__panel {
  border-radius: 20px;
  min-height: 216px;
  padding: 16px 16px 14px;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)),
    rgba(15, 23, 42, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(3px);
}

.post__panel-label {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 800;
  color: rgba(191, 219, 254, 0.74);
}

.post__panel-title {
  margin: 0 0 9px;
  font-size: 29px;
  line-height: 0.96;
  letter-spacing: -0.02em;
  color: #ffffff;
  font-weight: 800;
}

.post__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 7px;
}

.post__list li {
  position: relative;
  padding-left: 14px;
  font-size: 18px;
  line-height: 1.08;
  font-weight: 500;
  color: rgba(226, 232, 240, 0.9);
}

.post__list li::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 999px;
  position: absolute;
  left: 0;
  top: 9px;
  background: rgba(148, 163, 184, 0.8);
}

.post__footer {
  margin-top: auto;
}

.post__hook {
  margin: 0;
  font-size: 58px;
  line-height: 0.92;
  letter-spacing: -0.04em;
  font-weight: 800;
  color: #ffffff;
  max-width: 82%;
  text-wrap: balance;
}

.post__cta {
  margin-top: 10px;
  font-size: 24px;
  line-height: 1.08;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.86);
}

@media (max-width: 900px) {
  .post__layer {
    padding: 34px;
  }

  .post__title {
    font-size: 58px;
  }

  .post__subtitle {
    font-size: 20px;
    max-width: 100%;
  }

  .post__grid {
    grid-template-columns: 1fr;
  }

  .post__panel-title {
    font-size: 24px;
  }

  .post__list li {
    font-size: 16px;
  }

  .post__hook {
    font-size: 42px;
    max-width: 100%;
  }

  .post__cta {
    font-size: 20px;
  }
}`;

function createLibraryItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `studio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function replaceStudioLogoSrcForCanvas(html: string, logoInlineDataUrl: string | null) {
  if (!logoInlineDataUrl) return html;
  return html.replace(STUDIO_LOGO_SRC_PATTERN, `$1${logoInlineDataUrl}$2`);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de logo."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Falha ao converter logo para data URL."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

async function fetchStudioLogoDataUrl(logoUrl: string, cacheKey?: string | number) {
  const requestUrl = cacheKey ? `${logoUrl}?v=${encodeURIComponent(String(cacheKey))}` : logoUrl;
  const response = await fetch(requestUrl, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar logo para renderizacao.");
  }

  const blob = await response.blob();
  return blobToDataUrl(blob);
}

async function waitForNodeImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  if (images.length === 0) return;

  await Promise.all(
    images.map(async (image) => {
      if (image.complete) return;

      try {
        if ("decode" in image) {
          await image.decode();
          if (image.naturalWidth > 0) return;
        }
      } catch {
        // fallback to load/error listeners below
      }

      await new Promise<void>((resolve) => {
        const finalize = () => {
          image.removeEventListener("load", finalize);
          image.removeEventListener("error", finalize);
          resolve();
        };

        image.addEventListener("load", finalize, { once: true });
        image.addEventListener("error", finalize, { once: true });
      });
    }),
  );
}

function readLibraryItems(storageKey: string): StudioLibraryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is StudioLibraryItem => {
        return (
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.content === "string" &&
          typeof item.updatedAt === "number"
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function writeLibraryItems(storageKey: string, items: StudioLibraryItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

function stripScripts(input: string) {
  return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function sanitizeStructuralHtml(input: string) {
  return stripScripts(input)
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function sanitizeCssCode(input: string) {
  return stripScripts(input).replace(/<\/?style[^>]*>/gi, "");
}

function scopeSelectorList(selectorList: string, rootSelector: string) {
  return selectorList
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => {
      if (selector.startsWith(rootSelector)) return selector;
      if (selector === "html" || selector === "body" || selector === ":root") {
        return rootSelector;
      }
      if (selector.includes(":root")) {
        return selector.replace(/:root/g, rootSelector);
      }
      return `${rootSelector} ${selector}`;
    })
    .join(", ");
}

function findMatchingBrace(source: string, openBraceIndex: number) {
  let depth = 0;
  let quote: "'" | '"' | null = null;

  for (let i = openBraceIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (quote) {
      if (char === "\\") {
        i += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "/" && next === "*") {
      const commentEnd = source.indexOf("*/", i + 2);
      if (commentEnd === -1) return -1;
      i = commentEnd + 1;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function scopeStudioCss(css: string, rootSelector = ".studio-canvas-root"): string {
  let output = "";
  let cursor = 0;

  while (cursor < css.length) {
    const openIndex = css.indexOf("{", cursor);
    if (openIndex === -1) {
      output += css.slice(cursor);
      break;
    }

    const selectorChunk = css.slice(cursor, openIndex);
    const selector = selectorChunk.trim();
    const closeIndex = findMatchingBrace(css, openIndex);

    if (closeIndex === -1) {
      output += css.slice(cursor);
      break;
    }

    const body = css.slice(openIndex + 1, closeIndex);
    const leadingWhitespace = selectorChunk.match(/^\s*/)?.[0] ?? "";
    const trailingWhitespace = selectorChunk.match(/\s*$/)?.[0] ?? "";

    if (!selector) {
      output += `${selectorChunk}{${body}}`;
      cursor = closeIndex + 1;
      continue;
    }

    if (selector.startsWith("@")) {
      if (/^@(media|supports|layer|container)\b/i.test(selector)) {
        output += `${leadingWhitespace}${selector}${trailingWhitespace}{${scopeStudioCss(body, rootSelector)}}`;
      } else {
        output += `${leadingWhitespace}${selector}${trailingWhitespace}{${body}}`;
      }
      cursor = closeIndex + 1;
      continue;
    }

    output += `${leadingWhitespace}${scopeSelectorList(selector, rootSelector)}${trailingWhitespace}{${body}}`;
    cursor = closeIndex + 1;
  }

  return output;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  const decimals = size >= 100 || index === 0 ? 0 : 1;
  return `${size.toFixed(decimals)} ${units[index]}`;
}

function formatDateTimeLabel(isoString: string) {
  const timestamp = Date.parse(isoString);
  if (Number.isNaN(timestamp)) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

async function readApiErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const body = (await response.json()) as { message?: string };
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // ignore body parse error and return fallback
  }

  return fallbackMessage;
}

function StudioCanvas({
  html,
  css,
  width,
  height,
  className,
  logoInlineDataUrl,
  mode = "preview",
}: {
  html: string;
  css: string;
  width: number;
  height: number;
  className?: string;
  logoInlineDataUrl?: string | null;
  mode?: "preview" | "export";
}) {
  const safeHtml = useMemo(() => sanitizeStructuralHtml(html), [html]);
  const safeCss = useMemo(() => sanitizeCssCode(css), [css]);
  const scopedCss = useMemo(() => scopeStudioCss(safeCss), [safeCss]);
  const renderHtml = useMemo(
    () => replaceStudioLogoSrcForCanvas(safeHtml, logoInlineDataUrl ?? null),
    [safeHtml, logoInlineDataUrl],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[rgba(8,6,14,1)]",
        className,
      )}
      style={{ width, height }}
    >
      <style>{`
        .studio-canvas-root, .studio-canvas-root * { box-sizing: border-box; }
        .studio-canvas-root {
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        ${scopedCss}
        ${STUDIO_CANVAS_LOGO_GUARD_CSS}
        ${mode === "export" ? STUDIO_CANVAS_EXPORT_GUARD_CSS : ""}
      `}</style>
      <div
        className="studio-canvas-root"
        dangerouslySetInnerHTML={{ __html: renderHtml }}
      />
    </div>
  );
}

export function PostStudio() {
  const [presetKey, setPresetKey] = useState<StudioPresetKey>("feedPortrait");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  const [removingReferenceId, setRemovingReferenceId] = useState<string | null>(null);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [htmlLibrary, setHtmlLibrary] = useState<StudioLibraryItem[]>([]);
  const [cssLibrary, setCssLibrary] = useState<StudioLibraryItem[]>([]);
  const [selectedHtmlId, setSelectedHtmlId] = useState("");
  const [selectedCssId, setSelectedCssId] = useState("");
  const [librariesHydrated, setLibrariesHydrated] = useState(false);
  const [logoAsset, setLogoAsset] = useState<StudioLogoAsset | null>(null);
  const [referenceAssets, setReferenceAssets] = useState<StudioReferenceAsset[]>([]);
  const [logoUrl, setLogoUrl] = useState(STUDIO_LOGO_FIXED_URL);
  const [logoInlineDataUrl, setLogoInlineDataUrl] = useState<string | null>(null);
  const [logoRenderNonce, setLogoRenderNonce] = useState(0);
  const logoFileInputId = useId();
  const referencesFileInputId = useId();
  const exportRef = useRef<HTMLDivElement>(null);

  const preset = STUDIO_PRESETS.find((item) => item.key === presetKey) ?? STUDIO_PRESETS[0]!;
  const previewScale = Math.min(1, 520 / preset.width, 760 / preset.height);
  const previewWidth = Math.round(preset.width * previewScale);
  const previewHeight = Math.round(preset.height * previewScale);

  useEffect(() => {
    setHtmlLibrary(readLibraryItems(STUDIO_HTML_LIBRARY_KEY));
    setCssLibrary(readLibraryItems(STUDIO_CSS_LIBRARY_KEY));
    setLibrariesHydrated(true);
    void loadStudioAssets();
  }, []);

  useEffect(() => {
    if (!librariesHydrated) return;
    writeLibraryItems(STUDIO_HTML_LIBRARY_KEY, htmlLibrary);
  }, [htmlLibrary, librariesHydrated]);

  useEffect(() => {
    if (!librariesHydrated) return;
    writeLibraryItems(STUDIO_CSS_LIBRARY_KEY, cssLibrary);
  }, [cssLibrary, librariesHydrated]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => setSuccessMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    let isActive = true;

    if (!logoAsset) {
      setLogoInlineDataUrl(null);
      return () => {
        isActive = false;
      };
    }

    void (async () => {
      try {
        const dataUrl = await fetchStudioLogoDataUrl(logoUrl, logoAsset.updatedAt);
        if (isActive) {
          setLogoInlineDataUrl(dataUrl);
        }
      } catch {
        if (isActive) {
          // Keep any previous inline logo to avoid visual flicker on transient failures.
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [logoAsset, logoUrl]);

  async function loadStudioAssets() {
    setIsLoadingAssets(true);

    try {
      const response = await fetch("/api/studio/assets", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Falha ao carregar assets do Studio.");
        throw new Error(message);
      }

      const body = (await response.json()) as StudioAssetsResponse;
      setLogoAsset(body.logo ?? null);
      setReferenceAssets(Array.isArray(body.references) ? body.references : []);
      setLogoUrl(typeof body.logoUrl === "string" && body.logoUrl ? body.logoUrl : STUDIO_LOGO_FIXED_URL);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao carregar assets do Studio.",
      );
    } finally {
      setIsLoadingAssets(false);
    }
  }

  function applyStudioAssetsResponse(body: StudioAssetsResponse) {
    setLogoAsset(body.logo ?? null);
    setReferenceAssets(Array.isArray(body.references) ? body.references : []);
    setLogoUrl(typeof body.logoUrl === "string" && body.logoUrl ? body.logoUrl : STUDIO_LOGO_FIXED_URL);
  }

  async function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/studio/assets/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Falha ao enviar logo.");
        throw new Error(message);
      }

      const body = (await response.json()) as StudioAssetsResponse;
      applyStudioAssetsResponse(body);
      setLogoRenderNonce((value) => value + 1);
      setSuccessMessage(`Logo enviada. Use ${STUDIO_LOGO_FIXED_URL} no HTML quando quiser.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao enviar logo.");
    } finally {
      event.target.value = "";
      setIsUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!logoAsset) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRemovingLogo(true);

    try {
      const response = await fetch("/api/studio/assets/logo", {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Falha ao remover logo.");
        throw new Error(message);
      }

      const body = (await response.json()) as StudioAssetsResponse;
      applyStudioAssetsResponse(body);
      setLogoRenderNonce((value) => value + 1);
      setSuccessMessage("Logo removida.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao remover logo.");
    } finally {
      setIsRemovingLogo(false);
    }
  }

  async function handleReferenceFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingReferences(true);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/studio/assets/references", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Falha ao enviar arquivos de referencia.");
        throw new Error(message);
      }

      const body = (await response.json()) as StudioAssetsResponse;
      applyStudioAssetsResponse(body);
      setSuccessMessage(
        files.length === 1
          ? "Arquivo de referencia enviado."
          : `${files.length} arquivos de referencia enviados.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao enviar arquivos de referencia.",
      );
    } finally {
      event.target.value = "";
      setIsUploadingReferences(false);
    }
  }

  async function handleRemoveReference(referenceId: string) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRemovingReferenceId(referenceId);

    try {
      const response = await fetch(`/api/studio/assets/references/${encodeURIComponent(referenceId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Falha ao remover arquivo de referencia.");
        throw new Error(message);
      }

      const body = (await response.json()) as StudioAssetsResponse;
      applyStudioAssetsResponse(body);
      setSuccessMessage("Arquivo de referencia removido.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao remover arquivo de referencia.",
      );
    } finally {
      setRemovingReferenceId(null);
    }
  }

  function promptAndSaveLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const content = kind === "html" ? html.trim() : css.trim();

    if (!content) {
      setErrorMessage(`Nao ha conteudo de ${kind === "html" ? "HTML" : "CSS"} para salvar.`);
      return;
    }

    const selectedId = kind === "html" ? selectedHtmlId : selectedCssId;
    const currentItems = kind === "html" ? htmlLibrary : cssLibrary;
    const selectedItem = currentItems.find((item) => item.id === selectedId);
    const defaultName = selectedItem
      ? `${selectedItem.name} copia`
      : kind === "html"
        ? `Estrutura ${currentItems.length + 1}`
        : `Estilo ${currentItems.length + 1}`;

    const promptMessage = kind === "html" ? "Nome da estrutura HTML" : "Nome do estilo CSS";
    const rawName = window.prompt(promptMessage, defaultName);
    if (rawName === null) return;

    const name = rawName.trim();
    if (!name) {
      setErrorMessage(`Informe um nome para ${kind === "html" ? "a estrutura" : "o estilo"}.`);
      return;
    }

    const setItems = kind === "html" ? setHtmlLibrary : setCssLibrary;
    const selectItem = kind === "html" ? setSelectedHtmlId : setSelectedCssId;

    const existing = currentItems.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const updatedItem: StudioLibraryItem = existing
      ? { ...existing, name, content, updatedAt: Date.now() }
      : { id: createLibraryItemId(), name, content, updatedAt: Date.now() };

    const nextItems = [updatedItem, ...currentItems.filter((item) => item.id !== updatedItem.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    setItems(nextItems);
    selectItem(updatedItem.id);
    setSuccessMessage(`${kind === "html" ? "Estrutura" : "Estilo"} salvo com sucesso.`);
  }

  function updateSelectedLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedId = kind === "html" ? selectedHtmlId : selectedCssId;
    const items = kind === "html" ? htmlLibrary : cssLibrary;
    const setItems = kind === "html" ? setHtmlLibrary : setCssLibrary;
    const currentContent = kind === "html" ? html.trim() : css.trim();

    if (!currentContent) {
      setErrorMessage(`Nao ha conteudo de ${kind === "html" ? "HTML" : "CSS"} para atualizar.`);
      return;
    }

    const currentItem = items.find((item) => item.id === selectedId);
    if (!currentItem) {
      setErrorMessage(`Selecione ${kind === "html" ? "uma estrutura" : "um estilo"} para editar.`);
      return;
    }

    const promptMessage = kind === "html" ? "Editar nome da estrutura HTML" : "Editar nome do estilo CSS";
    const rawName = window.prompt(promptMessage, currentItem.name);
    if (rawName === null) return;

    const nextName = rawName.trim();
    if (!nextName) {
      setErrorMessage(`Informe um nome para ${kind === "html" ? "a estrutura" : "o estilo"}.`);
      return;
    }

    const duplicateByName = items.find(
      (item) => item.id !== currentItem.id && item.name.toLowerCase() === nextName.toLowerCase(),
    );
    if (duplicateByName) {
      setErrorMessage(`Ja existe ${kind === "html" ? "uma estrutura" : "um estilo"} com esse nome.`);
      return;
    }

    const updated = {
      ...currentItem,
      name: nextName,
      content: currentContent,
      updatedAt: Date.now(),
    };

    const nextItems = [updated, ...items.filter((item) => item.id !== currentItem.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    setItems(nextItems);
    setSuccessMessage(`${kind === "html" ? "Estrutura" : "Estilo"} atualizada.`);
  }

  function saveChangesToSelectedLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedId = kind === "html" ? selectedHtmlId : selectedCssId;
    const items = kind === "html" ? htmlLibrary : cssLibrary;
    const setItems = kind === "html" ? setHtmlLibrary : setCssLibrary;
    const currentContent = kind === "html" ? html.trim() : css.trim();

    if (!currentContent) {
      setErrorMessage(`Nao ha conteudo de ${kind === "html" ? "HTML" : "CSS"} para salvar.`);
      return;
    }

    const currentItem = items.find((item) => item.id === selectedId);
    if (!currentItem) {
      setErrorMessage(`Selecione ${kind === "html" ? "uma estrutura" : "um estilo"} para salvar alteracoes.`);
      return;
    }

    const updated = {
      ...currentItem,
      content: currentContent,
      updatedAt: Date.now(),
    };

    const nextItems = [updated, ...items.filter((item) => item.id !== currentItem.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    setItems(nextItems);
    setSuccessMessage(
      `${kind === "html" ? "Estrutura" : "Estilo"} salvo${kind === "html" ? "a" : ""} no item selecionado.`,
    );
  }

  function removeSelectedLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedId = kind === "html" ? selectedHtmlId : selectedCssId;
    const items = kind === "html" ? htmlLibrary : cssLibrary;
    const setItems = kind === "html" ? setHtmlLibrary : setCssLibrary;
    const clearSelected = kind === "html" ? setSelectedHtmlId : setSelectedCssId;

    const found = items.find((item) => item.id === selectedId);
    if (!found) {
      setErrorMessage(`Selecione ${kind === "html" ? "uma estrutura" : "um estilo"} para excluir.`);
      return;
    }

    const confirmed = window.confirm(
      `Excluir ${kind === "html" ? "a estrutura" : "o estilo"} "${found.name}" da biblioteca?`,
    );
    if (!confirmed) return;

    setItems(items.filter((item) => item.id !== selectedId));
    clearSelected("");
    setSuccessMessage(`${kind === "html" ? "Estrutura" : "Estilo"} removido.`);
  }

  async function handleDownloadPng() {
    if (!exportRef.current) return;
    setErrorMessage(null);
    setIsDownloading(true);

    try {
      if (logoAsset && html.includes(STUDIO_LOGO_FIXED_URL) && !logoInlineDataUrl) {
        const dataUrl = await fetchStudioLogoDataUrl(logoUrl, logoAsset.updatedAt);
        setLogoInlineDataUrl(dataUrl);
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      }

      await waitForNodeImages(exportRef.current);

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        includeQueryParams: true,
        pixelRatio: 1,
        fetchRequestInit: {
          cache: "no-store",
          credentials: "include",
        },
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `flowgram-post-${preset.width}x${preset.height}.png`;
      link.click();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Falha ao gerar PNG: ${error.message}`
          : "Falha ao gerar PNG.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Studio
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Post Builder (HTML + CSS)</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 self-center rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-2 py-2">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                Tamanho
              </span>
              <select
                className="h-10 min-w-[220px] rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                onChange={(event) => setPresetKey(event.target.value as StudioPresetKey)}
                value={presetKey}
              >
                {STUDIO_PRESETS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              className="self-center"
              onClick={() => {
                setHtml(DEFAULT_HTML);
                setCss(DEFAULT_CSS);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
              Resetar template
            </Button>

            <Button className="self-center" disabled={isDownloading} onClick={handleDownloadPng}>
              <Download className="h-4 w-4" />
              {isDownloading ? "Gerando..." : "Baixar PNG"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_580px]">
        <section className="panel-soft flex flex-col p-4 md:p-5">
          <div className="order-1 mb-4 grid gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.7)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Estruturas (HTML)
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
                  <select
                    className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedHtmlId(nextId);
                      if (!nextId) return;

                      const found = htmlLibrary.find((item) => item.id === nextId);
                      if (!found) return;

                      setHtml(sanitizeStructuralHtml(found.content));
                      setErrorMessage(null);
                      setSuccessMessage("Estrutura carregada.");
                    }}
                    value={selectedHtmlId}
                  >
                    <option value="">Selecione uma estrutura salva</option>
                    {htmlLibrary.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={() => promptAndSaveLibraryEntry("html")}
                    size="icon"
                    title="Salvar nova estrutura com o HTML atual"
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => saveChangesToSelectedLibraryEntry("html")}
                    size="icon"
                    title="Salvar alteracoes no item HTML selecionado"
                    variant="outline"
                  >
                    <Save className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => updateSelectedLibraryEntry("html")}
                    size="icon"
                    title="Renomear/editar item HTML selecionado"
                    variant="outline"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button onClick={() => removeSelectedLibraryEntry("html")} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.7)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                  <Save className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Estilos (CSS)
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
                  <select
                    className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedCssId(nextId);
                      if (!nextId) return;

                      const found = cssLibrary.find((item) => item.id === nextId);
                      if (!found) return;

                      setCss(found.content);
                      setErrorMessage(null);
                      setSuccessMessage("Estilo carregado.");
                    }}
                    value={selectedCssId}
                  >
                    <option value="">Selecione um estilo salvo</option>
                    {cssLibrary.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={() => promptAndSaveLibraryEntry("css")}
                    size="icon"
                    title="Salvar novo estilo com o CSS atual"
                    variant="secondary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => saveChangesToSelectedLibraryEntry("css")}
                    size="icon"
                    title="Salvar alteracoes no item CSS selecionado"
                    variant="outline"
                  >
                    <Save className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => updateSelectedLibraryEntry("css")}
                    size="icon"
                    title="Renomear/editar item CSS selecionado"
                    variant="outline"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button onClick={() => removeSelectedLibraryEntry("css")} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 mb-4 mt-4 grid gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.7)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Logo da marca
                  </p>
                  <code className="mt-1 block break-all rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(8,6,14,0.42)] px-2 py-1 text-[11px] text-[var(--foreground)]">
                    {logoUrl}
                  </code>
                </div>
              </div>

              <div className="grid gap-3">
                <input
                  accept="image/*,.svg"
                  className="sr-only"
                  disabled={isUploadingLogo}
                  id={logoFileInputId}
                  onChange={handleLogoFileChange}
                  type="file"
                />
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[rgba(249,87,192,0.24)] bg-[linear-gradient(180deg,rgba(249,87,192,0.05),rgba(168,60,255,0.02))] p-3 transition hover:border-[rgba(249,87,192,0.38)] hover:bg-[rgba(255,255,255,0.02)]",
                    isUploadingLogo && "pointer-events-none cursor-not-allowed opacity-70",
                  )}
                  htmlFor={logoFileInputId}
                >
                  <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-2 text-[var(--muted-soft)]">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {isUploadingLogo ? "Enviando logo..." : "Enviar logo da marca"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                    Escolher
                  </span>
                </label>

                {logoAsset ? (
                  <div className="grid gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(8,6,14,0.38)] p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                          {logoAsset.originalName}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatFileSize(logoAsset.size)} • {formatDateTimeLabel(logoAsset.updatedAt)}
                        </p>
                      </div>

                      <Button
                        disabled={isRemovingLogo}
                        onClick={handleRemoveLogo}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                      </Button>
                    </div>

                    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2">
                      <img
                        alt="Preview da logo"
                        className="max-h-20 max-w-full object-contain"
                        src={`${logoUrl}?v=${encodeURIComponent(logoAsset.updatedAt)}`}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">Sem logo enviada.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.7)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                  <Save className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Arquivos de referencia
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <input
                  className="sr-only"
                  disabled={isUploadingReferences}
                  id={referencesFileInputId}
                  multiple
                  onChange={handleReferenceFilesChange}
                  type="file"
                />
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[rgba(96,165,250,0.22)] bg-[linear-gradient(180deg,rgba(59,130,246,0.04),rgba(255,255,255,0.01))] p-3 transition hover:border-[rgba(96,165,250,0.36)] hover:bg-[rgba(255,255,255,0.02)]",
                    isUploadingReferences && "pointer-events-none cursor-not-allowed opacity-70",
                  )}
                  htmlFor={referencesFileInputId}
                >
                  <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-2 text-[var(--muted-soft)]">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {isUploadingReferences ? "Enviando arquivos..." : "Adicionar arquivos de referencia"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                    Selecionar
                  </span>
                </label>

                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(8,6,14,0.38)] p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                      Arquivos enviados
                    </p>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground)]">
                      {referenceAssets.length}
                    </span>
                  </div>

                  {isLoadingAssets ? (
                    <p className="text-xs text-[var(--muted)]">Carregando arquivos...</p>
                  ) : referenceAssets.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">Nenhum arquivo.</p>
                  ) : (
                    <div className="max-h-52 space-y-2 overflow-auto pr-1">
                      {referenceAssets.map((file) => (
                        <div
                          className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-2"
                          key={file.id}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-[var(--foreground)]">{file.originalName}</p>
                              <p className="text-[11px] text-[var(--muted)]">
                                {formatFileSize(file.size)} • {formatDateTimeLabel(file.uploadedAt)}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <a
                                className="inline-flex h-8 items-center rounded-lg border border-[rgba(255,255,255,0.08)] px-2 text-xs text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.05)]"
                                href={file.url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Abrir
                              </a>
                              <Button
                                disabled={removingReferenceId === file.id}
                                onClick={() => void handleRemoveReference(file.id)}
                                size="icon"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                HTML (modo estrutural)
              </label>
              <Textarea
                className="min-h-[340px] font-mono text-xs leading-5"
                onChange={(event) => setHtml(sanitizeStructuralHtml(event.target.value))}
                spellCheck={false}
                value={html}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                CSS
              </label>
              <Textarea
                className="min-h-[340px] font-mono text-xs leading-5"
                onChange={(event) => setCss(event.target.value)}
                spellCheck={false}
                value={css}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="order-4 mt-4 rounded-xl border border-[#8a3c58] bg-[rgba(72,20,36,0.35)] px-3 py-2 text-sm text-[#ffd1dd]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="order-5 mt-4 rounded-xl border border-[rgba(25,195,125,0.32)] bg-[rgba(18,56,42,0.32)] px-3 py-2 text-sm text-[#b7f4d9]">
              {successMessage}
            </div>
          ) : null}
        </section>

        <section className="panel-soft border-[rgba(148,163,184,0.16)] bg-[rgba(12,14,20,0.68)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                Preview
              </p>
              <p className="text-sm text-[var(--muted)]">
                {preset.width} x {preset.height}px
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[linear-gradient(180deg,rgba(18,22,30,0.92),rgba(11,14,20,0.95))] p-4">
            <div
              className="mx-auto overflow-hidden rounded-xl border border-[rgba(148,163,184,0.14)] bg-[linear-gradient(180deg,#11151d,#0c1016)] shadow-[0_24px_50px_rgba(0,0,0,0.42)]"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                style={{
                  width: preset.width,
                  height: preset.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                }}
              >
                <StudioCanvas
                  key={`preview-${logoRenderNonce}`}
                  css={css}
                  height={preset.height}
                  html={html}
                  logoInlineDataUrl={logoInlineDataUrl}
                  width={preset.width}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed -left-[99999px] top-0">
        <div ref={exportRef}>
          <StudioCanvas
            key={`export-${logoRenderNonce}`}
            css={css}
            height={preset.height}
            html={html}
            logoInlineDataUrl={logoInlineDataUrl}
            mode="export"
            width={preset.width}
          />
        </div>
      </div>
    </div>
  );
}

