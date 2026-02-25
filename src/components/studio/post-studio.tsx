"use client";

import { type ChangeEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Download, FolderOpen, Pencil, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StudioPresetKey = "feedPortrait" | "feedSquare" | "story";
type StudioHtmlLayerKey = "background" | "content" | "overlay";
type StudioLibraryKind = StudioHtmlLayerKey | "css";
type StudioPanelKey = StudioHtmlLayerKey | "css" | "logo" | "references";
type StudioModalKind = StudioLibraryKind | "composition";

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

interface StudioCompositionItem {
  id: string;
  name: string;
  layerIds: StudioHtmlLayerSelections;
  updatedAt: number;
}

interface StudioHtmlLayerConfig {
  key: StudioHtmlLayerKey;
  label: string;
  shortLabel: string;
  libraryKey: string;
  emptyLabel: string;
}

type StudioHtmlLayers = Record<StudioHtmlLayerKey, string>;
type StudioHtmlLayerLibraries = Record<StudioHtmlLayerKey, StudioLibraryItem[]>;
type StudioHtmlLayerSelections = Record<StudioHtmlLayerKey, string>;

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

const STUDIO_LEGACY_HTML_LIBRARY_KEY = "flowgram-lab:studio:html-library:v1";
const STUDIO_HTML_BACKGROUND_LIBRARY_KEY = "flowgram-lab:studio:html-background-library:v1";
const STUDIO_HTML_CONTENT_LIBRARY_KEY = "flowgram-lab:studio:html-content-library:v1";
const STUDIO_HTML_OVERLAY_LIBRARY_KEY = "flowgram-lab:studio:html-overlay-library:v1";
const STUDIO_CSS_LIBRARY_KEY = "flowgram-lab:studio:css-library:v1";
const STUDIO_COMPOSITION_LIBRARY_KEY = "flowgram-lab:studio:composition-library:v1";
const STUDIO_LOGO_FIXED_URL = "/api/studio/assets/logo";
const STUDIO_HTML_LAYER_CONFIGS: StudioHtmlLayerConfig[] = [
  {
    key: "background",
    label: "Fundo (HTML)",
    shortLabel: "Fundo",
    libraryKey: STUDIO_HTML_BACKGROUND_LIBRARY_KEY,
    emptyLabel: "Selecione um fundo salvo",
  },
  {
    key: "content",
    label: "Conteudo (HTML)",
    shortLabel: "Conteudo",
    libraryKey: STUDIO_HTML_CONTENT_LIBRARY_KEY,
    emptyLabel: "Selecione um conteudo salvo",
  },
  {
    key: "overlay",
    label: "Shapes (HTML)",
    shortLabel: "Shapes",
    libraryKey: STUDIO_HTML_OVERLAY_LIBRARY_KEY,
    emptyLabel: "Selecione um layer de shapes salvo",
  },
];
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
.studio-canvas-root .post {
  border-radius: 0 !important;
}
`;
const STUDIO_LOGO_SRC_PATTERN =
  /(\bsrc\s*=\s*["'])(?:https?:\/\/[^"' ]+)?\/api\/studio\/assets\/logo(?:\?[^"']*)?(["'])/gi;

const DEFAULT_HTML_BACKGROUND = `<article class="post" aria-hidden="true">
  <div class="post__glow post__glow--a"></div>
  <div class="post__glow post__glow--b"></div>
</article>`;

const DEFAULT_HTML_CONTENT = `<article class="post post--content-layer">
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

const DEFAULT_HTML_OVERLAY = ``;
const DEFAULT_HTML_LAYERS: StudioHtmlLayers = {
  background: DEFAULT_HTML_BACKGROUND,
  content: DEFAULT_HTML_CONTENT,
  overlay: DEFAULT_HTML_OVERLAY,
};

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

.post--content-layer {
  border-color: transparent;
  background: transparent;
  border-radius: 0;
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

function readCompositionItems(storageKey: string): StudioCompositionItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is StudioCompositionItem => {
        if (!item || typeof item !== "object") return false;
        if (
          typeof item.id !== "string" ||
          typeof item.name !== "string" ||
          typeof item.updatedAt !== "number" ||
          !item.layerIds ||
          typeof item.layerIds !== "object"
        ) {
          return false;
        }

        return (
          typeof item.layerIds.background === "string" &&
          typeof item.layerIds.content === "string" &&
          typeof item.layerIds.overlay === "string"
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

function writeCompositionItems(storageKey: string, items: StudioCompositionItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey, JSON.stringify(items));
}

function cloneHtmlLayerSelections(source: StudioHtmlLayerSelections): StudioHtmlLayerSelections {
  return {
    background: source.background,
    content: source.content,
    overlay: source.overlay,
  };
}

function createEmptyHtmlLayerLibraries(): StudioHtmlLayerLibraries {
  return {
    background: [],
    content: [],
    overlay: [],
  };
}

function createEmptyHtmlLayerSelections(): StudioHtmlLayerSelections {
  return {
    background: "",
    content: "",
    overlay: "",
  };
}

function getLayerConfig(layerKey: StudioHtmlLayerKey) {
  return STUDIO_HTML_LAYER_CONFIGS.find((config) => config.key === layerKey) ?? STUDIO_HTML_LAYER_CONFIGS[0]!;
}

function getLibraryKindLabel(kind: StudioLibraryKind) {
  if (kind === "css") {
    return {
      singular: "estilo",
      singularTitle: "Estilo",
      definiteArticle: "o",
      indefiniteArticle: "um",
      pastSaved: "salvo",
      pastUpdated: "atualizado",
      pastRemoved: "removido",
      promptNew: "Nome do estilo CSS",
      promptEdit: "Editar nome do estilo CSS",
      defaultBase: "Estilo",
    };
  }

  const layer = getLayerConfig(kind);
  return {
    singular: `camada ${layer.shortLabel.toLowerCase()}`,
    singularTitle: `Camada ${layer.shortLabel}`,
    definiteArticle: "a",
    indefiniteArticle: "uma",
    pastSaved: "salva",
    pastUpdated: "atualizada",
    pastRemoved: "removida",
    promptNew: `Nome da camada ${layer.shortLabel.toLowerCase()} (HTML)`,
    promptEdit: `Editar nome da camada ${layer.shortLabel.toLowerCase()} (HTML)`,
    defaultBase: layer.shortLabel,
  };
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
  htmlLayers,
  css,
  width,
  height,
  className,
  logoInlineDataUrl,
  mode = "preview",
}: {
  htmlLayers: StudioHtmlLayers;
  css: string;
  width: number;
  height: number;
  className?: string;
  logoInlineDataUrl?: string | null;
  mode?: "preview" | "export";
}) {
  const safeHtmlLayers = useMemo<StudioHtmlLayers>(
    () => ({
      background: sanitizeStructuralHtml(htmlLayers.background),
      content: sanitizeStructuralHtml(htmlLayers.content),
      overlay: sanitizeStructuralHtml(htmlLayers.overlay),
    }),
    [htmlLayers],
  );
  const safeCss = useMemo(() => sanitizeCssCode(css), [css]);
  const scopedCss = useMemo(() => scopeStudioCss(safeCss), [safeCss]);
  const renderHtmlLayers = useMemo<StudioHtmlLayers>(
    () => ({
      background: replaceStudioLogoSrcForCanvas(safeHtmlLayers.background, logoInlineDataUrl ?? null),
      content: replaceStudioLogoSrcForCanvas(safeHtmlLayers.content, logoInlineDataUrl ?? null),
      overlay: replaceStudioLogoSrcForCanvas(safeHtmlLayers.overlay, logoInlineDataUrl ?? null),
    }),
    [safeHtmlLayers, logoInlineDataUrl],
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
          position: relative;
        }
        .studio-canvas-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .studio-canvas-layer--background { z-index: 1; }
        .studio-canvas-layer--content { z-index: 2; }
        .studio-canvas-layer--overlay { z-index: 3; }
        .studio-canvas-layer > * {
          max-width: 100%;
        }
        ${scopedCss}
        ${STUDIO_CANVAS_LOGO_GUARD_CSS}
        ${mode === "export" ? STUDIO_CANVAS_EXPORT_GUARD_CSS : ""}
      `}</style>
      <div className="studio-canvas-root">
        <div
          className="studio-canvas-layer studio-canvas-layer--background"
          dangerouslySetInnerHTML={{ __html: renderHtmlLayers.background }}
        />
        <div
          className="studio-canvas-layer studio-canvas-layer--content"
          dangerouslySetInnerHTML={{ __html: renderHtmlLayers.content }}
        />
        <div
          className="studio-canvas-layer studio-canvas-layer--overlay"
          dangerouslySetInnerHTML={{ __html: renderHtmlLayers.overlay }}
        />
      </div>
    </div>
  );
}

export function PostStudio() {
  const [presetKey, setPresetKey] = useState<StudioPresetKey>("feedPortrait");
  const [htmlLayers, setHtmlLayers] = useState<StudioHtmlLayers>(DEFAULT_HTML_LAYERS);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  const [removingReferenceId, setRemovingReferenceId] = useState<string | null>(null);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [htmlLayerLibraries, setHtmlLayerLibraries] = useState<StudioHtmlLayerLibraries>(
    createEmptyHtmlLayerLibraries,
  );
  const [cssLibrary, setCssLibrary] = useState<StudioLibraryItem[]>([]);
  const [compositionLibrary, setCompositionLibrary] = useState<StudioCompositionItem[]>([]);
  const [selectedHtmlLayerIds, setSelectedHtmlLayerIds] = useState<StudioHtmlLayerSelections>(
    createEmptyHtmlLayerSelections,
  );
  const [selectedCssId, setSelectedCssId] = useState("");
  const [selectedCompositionId, setSelectedCompositionId] = useState("");
  const [activeModalKind, setActiveModalKind] = useState<StudioModalKind | null>(null);
  const [librariesHydrated, setLibrariesHydrated] = useState(false);
  const [logoAsset, setLogoAsset] = useState<StudioLogoAsset | null>(null);
  const [referenceAssets, setReferenceAssets] = useState<StudioReferenceAsset[]>([]);
  const [logoUrl, setLogoUrl] = useState(STUDIO_LOGO_FIXED_URL);
  const [logoInlineDataUrl, setLogoInlineDataUrl] = useState<string | null>(null);
  const [logoRenderNonce, setLogoRenderNonce] = useState(0);
  const [openPanels, setOpenPanels] = useState<Record<StudioPanelKey, boolean>>({
    background: false,
    content: true,
    overlay: false,
    css: true,
    logo: false,
    references: false,
  });
  const logoFileInputId = useId();
  const referencesFileInputId = useId();
  const exportRef = useRef<HTMLDivElement>(null);

  const preset = STUDIO_PRESETS.find((item) => item.key === presetKey) ?? STUDIO_PRESETS[0]!;
  const previewScale = Math.min(1, 520 / preset.width, 760 / preset.height);
  const previewWidth = Math.round(preset.width * previewScale);
  const previewHeight = Math.round(preset.height * previewScale);
  const combinedHtmlForLogoCheck = `${htmlLayers.background}\n${htmlLayers.content}\n${htmlLayers.overlay}`;

  function handlePanelToggle(panelKey: StudioPanelKey, nextOpen: boolean) {
    setOpenPanels((prev) => ({ ...prev, [panelKey]: nextOpen }));
  }

  useEffect(() => {
    const nextHtmlLibraries = createEmptyHtmlLayerLibraries();
    for (const layer of STUDIO_HTML_LAYER_CONFIGS) {
      let items = readLibraryItems(layer.libraryKey);
      if (layer.key === "content" && items.length === 0) {
        items = readLibraryItems(STUDIO_LEGACY_HTML_LIBRARY_KEY);
      }
      nextHtmlLibraries[layer.key] = items;
    }

    setHtmlLayerLibraries(nextHtmlLibraries);
    setCssLibrary(readLibraryItems(STUDIO_CSS_LIBRARY_KEY));
    setCompositionLibrary(readCompositionItems(STUDIO_COMPOSITION_LIBRARY_KEY));
    setLibrariesHydrated(true);
    void loadStudioAssets();
  }, []);

  useEffect(() => {
    if (!librariesHydrated) return;
    for (const layer of STUDIO_HTML_LAYER_CONFIGS) {
      writeLibraryItems(layer.libraryKey, htmlLayerLibraries[layer.key]);
    }
  }, [htmlLayerLibraries, librariesHydrated]);

  useEffect(() => {
    if (!librariesHydrated) return;
    writeLibraryItems(STUDIO_CSS_LIBRARY_KEY, cssLibrary);
  }, [cssLibrary, librariesHydrated]);

  useEffect(() => {
    if (!librariesHydrated) return;
    writeCompositionItems(STUDIO_COMPOSITION_LIBRARY_KEY, compositionLibrary);
  }, [compositionLibrary, librariesHydrated]);

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

  function setHtmlLayerContent(layerKey: StudioHtmlLayerKey, value: string) {
    setSelectedCompositionId("");
    setHtmlLayers((prev) => ({ ...prev, [layerKey]: sanitizeStructuralHtml(value) }));
  }

  function getLibraryItemsForKind(kind: StudioLibraryKind) {
    if (kind === "css") return cssLibrary;
    return htmlLayerLibraries[kind];
  }

  function setLibraryItemsForKind(kind: StudioLibraryKind, items: StudioLibraryItem[]) {
    if (kind === "css") {
      setCssLibrary(items);
      return;
    }

    setHtmlLayerLibraries((prev) => ({ ...prev, [kind]: items }));
  }

  function getSelectedLibraryIdForKind(kind: StudioLibraryKind) {
    if (kind === "css") return selectedCssId;
    return selectedHtmlLayerIds[kind];
  }

  function setSelectedLibraryIdForKind(kind: StudioLibraryKind, id: string) {
    if (kind === "css") {
      setSelectedCssId(id);
      return;
    }

    setSelectedHtmlLayerIds((prev) => ({ ...prev, [kind]: id }));
  }

  function getCurrentEditorContentForKind(kind: StudioLibraryKind) {
    if (kind === "css") return css;
    return htmlLayers[kind];
  }

  function setCurrentEditorContentForKind(kind: StudioLibraryKind, content: string) {
    if (kind === "css") {
      setCss(content);
      return;
    }

    setHtmlLayerContent(kind, content);
  }

  function loadSelectedLibraryEntry(kind: StudioLibraryKind, nextId: string) {
    if (kind !== "css") {
      setSelectedCompositionId("");
    }

    setSelectedLibraryIdForKind(kind, nextId);
    if (!nextId) return;

    const found = getLibraryItemsForKind(kind).find((item) => item.id === nextId);
    if (!found) return;

    setCurrentEditorContentForKind(kind, found.content);
    setErrorMessage(null);
    const labels = getLibraryKindLabel(kind);
    setSuccessMessage(`${labels.singularTitle} carregada.`);
  }

  function promptAndSaveLibraryEntry(kind: StudioLibraryKind) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const content = getCurrentEditorContentForKind(kind).trim();
    const labels = getLibraryKindLabel(kind);

    if (!content) {
      setErrorMessage(`Nao ha conteudo de ${labels.singular} para salvar.`);
      return;
    }

    const selectedId = getSelectedLibraryIdForKind(kind);
    const currentItems = getLibraryItemsForKind(kind);
    const selectedItem = currentItems.find((item) => item.id === selectedId);
    const defaultName = selectedItem
      ? `${selectedItem.name} copia`
      : `${labels.defaultBase} ${currentItems.length + 1}`;

    const rawName = window.prompt(labels.promptNew, defaultName);
    if (rawName === null) return;

    const name = rawName.trim();
    if (!name) {
      setErrorMessage(`Informe um nome para ${labels.definiteArticle} ${labels.singular}.`);
      return;
    }

    const existing = currentItems.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const updatedItem: StudioLibraryItem = existing
      ? { ...existing, name, content, updatedAt: Date.now() }
      : { id: createLibraryItemId(), name, content, updatedAt: Date.now() };

    const nextItems = [updatedItem, ...currentItems.filter((item) => item.id !== updatedItem.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    setLibraryItemsForKind(kind, nextItems);
    setSelectedLibraryIdForKind(kind, updatedItem.id);
    setSuccessMessage(`${labels.singularTitle} ${labels.pastSaved} com sucesso.`);
  }

  function updateSelectedLibraryEntry(kind: StudioLibraryKind) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const labels = getLibraryKindLabel(kind);
    const selectedId = getSelectedLibraryIdForKind(kind);
    const items = getLibraryItemsForKind(kind);
    const currentContent = getCurrentEditorContentForKind(kind).trim();

    if (!currentContent) {
      setErrorMessage(`Nao ha conteudo de ${labels.singular} para atualizar.`);
      return;
    }

    const currentItem = items.find((item) => item.id === selectedId);
    if (!currentItem) {
      setErrorMessage(`Selecione ${labels.indefiniteArticle} ${labels.singular} para editar.`);
      return;
    }

    const rawName = window.prompt(labels.promptEdit, currentItem.name);
    if (rawName === null) return;

    const nextName = rawName.trim();
    if (!nextName) {
      setErrorMessage(`Informe um nome para ${labels.definiteArticle} ${labels.singular}.`);
      return;
    }

    const duplicateByName = items.find(
      (item) => item.id !== currentItem.id && item.name.toLowerCase() === nextName.toLowerCase(),
    );
    if (duplicateByName) {
      setErrorMessage(`Ja existe ${labels.indefiniteArticle} ${labels.singular} com esse nome.`);
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
    setLibraryItemsForKind(kind, nextItems);
    setSuccessMessage(`${labels.singularTitle} ${labels.pastUpdated}.`);
  }

  function saveChangesToSelectedLibraryEntry(kind: StudioLibraryKind) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const labels = getLibraryKindLabel(kind);
    const selectedId = getSelectedLibraryIdForKind(kind);
    const items = getLibraryItemsForKind(kind);
    const currentContent = getCurrentEditorContentForKind(kind).trim();

    if (!currentContent) {
      setErrorMessage(`Nao ha conteudo de ${labels.singular} para salvar.`);
      return;
    }

    const currentItem = items.find((item) => item.id === selectedId);
    if (!currentItem) {
      setErrorMessage(`Selecione ${labels.indefiniteArticle} ${labels.singular} para salvar alteracoes.`);
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

    setLibraryItemsForKind(kind, nextItems);
    setSuccessMessage(`${labels.singularTitle} ${labels.pastSaved} no item selecionado.`);
  }

  function removeSelectedLibraryEntry(kind: StudioLibraryKind) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const labels = getLibraryKindLabel(kind);
    const selectedId = getSelectedLibraryIdForKind(kind);
    const items = getLibraryItemsForKind(kind);

    const found = items.find((item) => item.id === selectedId);
    if (!found) {
      setErrorMessage(`Selecione ${labels.indefiniteArticle} ${labels.singular} para excluir.`);
      return;
    }

    const confirmed = window.confirm(`Excluir ${labels.singular} "${found.name}" da biblioteca?`);
    if (!confirmed) return;

    setLibraryItemsForKind(
      kind,
      items.filter((item) => item.id !== selectedId),
    );
    setSelectedLibraryIdForKind(kind, "");
    setSuccessMessage(`${labels.singularTitle} ${labels.pastRemoved}.`);
  }

  function getSelectedLibraryName(kind: StudioLibraryKind) {
    const selectedId = getSelectedLibraryIdForKind(kind);
    if (!selectedId) return "Sem template";

    const found = getLibraryItemsForKind(kind).find((item) => item.id === selectedId);
    return found?.name ?? "Template ausente";
  }

  function getSelectedCompositionName() {
    if (!selectedCompositionId) return "Sem conjunto";
    const found = compositionLibrary.find((item) => item.id === selectedCompositionId);
    return found?.name ?? "Conjunto ausente";
  }

  function openLibraryModal(kind: StudioModalKind) {
    setActiveModalKind(kind);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function closeLibraryModal() {
    setActiveModalKind(null);
  }

  function loadCompositionEntry(nextId: string) {
    setSelectedCompositionId(nextId);
    if (!nextId) return;

    const composition = compositionLibrary.find((item) => item.id === nextId);
    if (!composition) return;

    const nextSelectedLayerIds = cloneHtmlLayerSelections(composition.layerIds);
    const missingLayers: string[] = [];

    setSelectedHtmlLayerIds(nextSelectedLayerIds);
    setHtmlLayers((prev) => {
      const next = { ...prev };

      for (const layer of STUDIO_HTML_LAYER_CONFIGS) {
        const targetId = nextSelectedLayerIds[layer.key];
        if (!targetId) {
          next[layer.key] = DEFAULT_HTML_LAYERS[layer.key];
          continue;
        }

        const found = htmlLayerLibraries[layer.key].find((item) => item.id === targetId);
        if (!found) {
          missingLayers.push(layer.shortLabel);
          continue;
        }

        next[layer.key] = sanitizeStructuralHtml(found.content);
      }

      return next;
    });

    if (missingLayers.length > 0) {
      setErrorMessage(`Templates ausentes no conjunto: ${missingLayers.join(", ")}.`);
    } else {
      setErrorMessage(null);
    }

    setSuccessMessage("Conjunto carregado.");
  }

  function promptAndSaveCompositionEntry() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const hasAnyLayerSelected = Object.values(selectedHtmlLayerIds).some((value) => value.trim().length > 0);
    if (!hasAnyLayerSelected) {
      setErrorMessage("Selecione pelo menos um template HTML para salvar o conjunto.");
      return;
    }

    const selectedItem = compositionLibrary.find((item) => item.id === selectedCompositionId);
    const defaultName = selectedItem
      ? `${selectedItem.name} copia`
      : `Conjunto ${compositionLibrary.length + 1}`;
    const rawName = window.prompt("Nome do conjunto (HTML)", defaultName);
    if (rawName === null) return;

    const name = rawName.trim();
    if (!name) {
      setErrorMessage("Informe um nome para o conjunto.");
      return;
    }

    const existing = compositionLibrary.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const updatedItem: StudioCompositionItem = existing
      ? {
          ...existing,
          name,
          layerIds: cloneHtmlLayerSelections(selectedHtmlLayerIds),
          updatedAt: Date.now(),
        }
      : {
          id: createLibraryItemId(),
          name,
          layerIds: cloneHtmlLayerSelections(selectedHtmlLayerIds),
          updatedAt: Date.now(),
        };

    const nextItems = [updatedItem, ...compositionLibrary.filter((item) => item.id !== updatedItem.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );

    setCompositionLibrary(nextItems);
    setSelectedCompositionId(updatedItem.id);
    setSuccessMessage("Conjunto salvo.");
  }

  function saveChangesToSelectedCompositionEntry() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const current = compositionLibrary.find((item) => item.id === selectedCompositionId);
    if (!current) {
      setErrorMessage("Selecione um conjunto para salvar alteracoes.");
      return;
    }

    const updated: StudioCompositionItem = {
      ...current,
      layerIds: cloneHtmlLayerSelections(selectedHtmlLayerIds),
      updatedAt: Date.now(),
    };
    const nextItems = [updated, ...compositionLibrary.filter((item) => item.id !== current.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    setCompositionLibrary(nextItems);
    setSuccessMessage("Conjunto salvo no item selecionado.");
  }

  function updateSelectedCompositionEntry() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const current = compositionLibrary.find((item) => item.id === selectedCompositionId);
    if (!current) {
      setErrorMessage("Selecione um conjunto para editar.");
      return;
    }

    const rawName = window.prompt("Editar nome do conjunto (HTML)", current.name);
    if (rawName === null) return;

    const nextName = rawName.trim();
    if (!nextName) {
      setErrorMessage("Informe um nome para o conjunto.");
      return;
    }

    const duplicate = compositionLibrary.find(
      (item) => item.id !== current.id && item.name.toLowerCase() === nextName.toLowerCase(),
    );
    if (duplicate) {
      setErrorMessage("Ja existe um conjunto com esse nome.");
      return;
    }

    const updated: StudioCompositionItem = {
      ...current,
      name: nextName,
      layerIds: cloneHtmlLayerSelections(selectedHtmlLayerIds),
      updatedAt: Date.now(),
    };
    const nextItems = [updated, ...compositionLibrary.filter((item) => item.id !== current.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    setCompositionLibrary(nextItems);
    setSuccessMessage("Conjunto atualizado.");
  }

  function removeSelectedCompositionEntry() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const current = compositionLibrary.find((item) => item.id === selectedCompositionId);
    if (!current) {
      setErrorMessage("Selecione um conjunto para excluir.");
      return;
    }

    const confirmed = window.confirm(`Excluir o conjunto "${current.name}" da biblioteca?`);
    if (!confirmed) return;

    setCompositionLibrary(compositionLibrary.filter((item) => item.id !== current.id));
    setSelectedCompositionId("");
    setSuccessMessage("Conjunto removido.");
  }

  function getModalTitle(kind: StudioModalKind | null) {
    if (!kind) return "";
    if (kind === "composition") return "Conjuntos (HTML)";
    if (kind === "css") return "Estilos (CSS)";
    return `${getLayerConfig(kind).label}`;
  }

  function handleModalSelect(itemId: string) {
    if (!activeModalKind) return;
    if (activeModalKind === "composition") {
      loadCompositionEntry(itemId);
      return;
    }

    loadSelectedLibraryEntry(activeModalKind, itemId);
  }

  function handleModalCreate() {
    if (!activeModalKind) return;
    if (activeModalKind === "composition") {
      promptAndSaveCompositionEntry();
      return;
    }
    promptAndSaveLibraryEntry(activeModalKind);
  }

  function handleModalSaveCurrent() {
    if (!activeModalKind) return;
    if (activeModalKind === "composition") {
      saveChangesToSelectedCompositionEntry();
      return;
    }
    saveChangesToSelectedLibraryEntry(activeModalKind);
  }

  function handleModalRename() {
    if (!activeModalKind) return;
    if (activeModalKind === "composition") {
      updateSelectedCompositionEntry();
      return;
    }
    updateSelectedLibraryEntry(activeModalKind);
  }

  function handleModalDelete() {
    if (!activeModalKind) return;
    if (activeModalKind === "composition") {
      removeSelectedCompositionEntry();
      return;
    }
    removeSelectedLibraryEntry(activeModalKind);
  }

  async function handleDownloadPng() {
    if (!exportRef.current) return;
    setErrorMessage(null);
    setIsDownloading(true);

    try {
      if (logoAsset && combinedHtmlForLogoCheck.includes(STUDIO_LOGO_FIXED_URL) && !logoInlineDataUrl) {
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

  const modalItems =
    activeModalKind === null
      ? []
      : activeModalKind === "composition"
        ? compositionLibrary
        : getLibraryItemsForKind(activeModalKind);
  const modalSelectedId =
    activeModalKind === null
      ? ""
      : activeModalKind === "composition"
        ? selectedCompositionId
        : getSelectedLibraryIdForKind(activeModalKind);

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Studio
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Post Builder (Camadas HTML + CSS)</h2>
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
                setHtmlLayers(DEFAULT_HTML_LAYERS);
                setCss(DEFAULT_CSS);
                setSelectedHtmlLayerIds(createEmptyHtmlLayerSelections());
                setSelectedCssId("");
                setSelectedCompositionId("");
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
          <div className="order-1 mb-4">
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.64)] px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Conjunto (HTML)
                  </span>
                </div>

                <button
                  className="min-w-0 max-w-full truncate rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-sm text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.06)]"
                  onClick={() => openLibraryModal("composition")}
                  type="button"
                >
                  {getSelectedCompositionName()}
                </button>
              </div>
            </div>
          </div>

          <div className="order-3 mb-4 mt-4 grid gap-3">
            <details
              className="group rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.64)]"
              onToggle={(event) => handlePanelToggle("logo", (event.currentTarget as HTMLDetailsElement).open)}
              open={openPanels.logo}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Logo da marca
                </span>
                <code className="max-w-[70%] truncate rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(8,6,14,0.42)] px-2 py-1 text-[11px] text-[var(--foreground)]">
                  {logoUrl}
                </code>
              </summary>

              <div className="grid gap-3 px-3 pb-3">
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
            </details>

            <details
              className="group rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.64)]"
              onToggle={(event) =>
                handlePanelToggle("references", (event.currentTarget as HTMLDetailsElement).open)
              }
              open={openPanels.references}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Arquivos de referencia
                </span>
                <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground)]">
                  {referenceAssets.length}
                </span>
              </summary>

              <div className="grid gap-3 px-3 pb-3">
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
            </details>
          </div>

          <div className="order-2 grid gap-3">
            {STUDIO_HTML_LAYER_CONFIGS.map((layer) => (
              <details
                className="group rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.64)]"
                key={layer.key}
                onToggle={(event) =>
                  handlePanelToggle(layer.key, (event.currentTarget as HTMLDetailsElement).open)
                }
                open={openPanels[layer.key]}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    {layer.label}
                  </span>
                  <button
                    className="min-w-0 max-w-[68%] truncate rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-sm text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.06)]"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openLibraryModal(layer.key);
                    }}
                    type="button"
                  >
                    {getSelectedLibraryName(layer.key)}
                  </button>
                </summary>

                <div className="px-3 pb-3">
                  <Textarea
                    className={cn(
                      "font-mono text-xs leading-5",
                      layer.key === "content" ? "min-h-[320px]" : "min-h-[170px]",
                    )}
                    onChange={(event) => setHtmlLayerContent(layer.key, event.target.value)}
                    spellCheck={false}
                    value={htmlLayers[layer.key]}
                  />
                </div>
              </details>
            ))}

            <details
              className="group rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.64)]"
              onToggle={(event) => handlePanelToggle("css", (event.currentTarget as HTMLDetailsElement).open)}
              open={openPanels.css}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  CSS
                </span>
                <button
                  className="min-w-0 max-w-[68%] truncate rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-sm text-[var(--foreground)] transition hover:bg-[rgba(255,255,255,0.06)]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    openLibraryModal("css");
                  }}
                  type="button"
                >
                  {getSelectedLibraryName("css")}
                </button>
              </summary>

              <div className="px-3 pb-3">
                <Textarea
                  className="min-h-[340px] font-mono text-xs leading-5"
                  onChange={(event) => setCss(event.target.value)}
                  spellCheck={false}
                  value={css}
                />
              </div>
            </details>
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

          <div className="rounded-2xl border border-[rgba(148,163,184,0.15)] bg-[rgba(12,14,20,0.32)] p-3">
            <div className="mx-auto" style={{ width: previewWidth, height: previewHeight }}>
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
                  htmlLayers={htmlLayers}
                  logoInlineDataUrl={logoInlineDataUrl}
                  mode="export"
                  width={preset.width}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {activeModalKind ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(4,3,8,0.72)] p-4"
          onClick={closeLibraryModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[rgba(148,163,184,0.18)] bg-[rgba(14,10,24,0.96)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">{getModalTitle(activeModalKind)}</p>
              <Button onClick={closeLibraryModal} size="sm" variant="ghost">
                Fechar
              </Button>
            </div>

            <div className="grid gap-3 p-4">
              <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_auto_1fr]">
                <Button onClick={handleModalCreate} size="sm" variant="secondary">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
                <Button onClick={handleModalSaveCurrent} size="sm" variant="outline">
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
                <Button onClick={handleModalRename} size="sm" variant="outline">
                  <Pencil className="h-4 w-4" />
                  Renomear
                </Button>
                <Button onClick={handleModalDelete} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                  Excluir
                </Button>
              </div>

              <div className="max-h-[340px] overflow-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(8,6,14,0.4)] p-2">
                {modalItems.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-[var(--muted)]">Nenhum item salvo.</p>
                ) : (
                  <div className="space-y-1">
                    {modalItems.map((item) => {
                      const isActive = item.id === modalSelectedId;
                      return (
                        <button
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition",
                            isActive
                              ? "border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.09)]"
                              : "border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.015)] hover:bg-[rgba(255,255,255,0.03)]",
                          )}
                          key={item.id}
                          onClick={() => handleModalSelect(item.id)}
                          type="button"
                        >
                          <span className="truncate text-sm text-[var(--foreground)]">{item.name}</span>
                          <span className="shrink-0 text-[11px] text-[var(--muted)]">
                            {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed -left-[99999px] top-0">
        <div ref={exportRef}>
          <StudioCanvas
            key={`export-${logoRenderNonce}`}
            css={css}
            height={preset.height}
            htmlLayers={htmlLayers}
            logoInlineDataUrl={logoInlineDataUrl}
            mode="export"
            width={preset.width}
          />
        </div>
      </div>
    </div>
  );
}

