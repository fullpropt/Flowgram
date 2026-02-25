"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FolderOpen, RotateCcw, Save, Trash2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const STUDIO_PRESETS: StudioPreset[] = [
  { key: "feedPortrait", label: "Feed 4:5 (1080x1350)", width: 1080, height: 1350 },
  { key: "feedSquare", label: "Feed 1:1 (1080x1080)", width: 1080, height: 1080 },
  { key: "story", label: "Story 9:16 (1080x1920)", width: 1080, height: 1920 },
];

const STUDIO_HTML_LIBRARY_KEY = "flowgram-lab:studio:html-library:v1";
const STUDIO_CSS_LIBRARY_KEY = "flowgram-lab:studio:css-library:v1";

const DEFAULT_HTML = `<div class="card">
  <div class="eyebrow">FLOWGRAM LAB</div>
  <h1>Headline forte em 2 linhas para o post</h1>
  <p>Subtexto curto com promessa, contexto ou explicacao da ideia principal.</p>
  <div class="footer">
    <span class="pill">Grupo</span>
    <span class="pill">Formato</span>
  </div>
</div>`;

const DEFAULT_CSS = `.card {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 72px;
  background:
    radial-gradient(circle at 10% 8%, rgba(255, 122, 168, 0.30), transparent 38%),
    radial-gradient(circle at 90% 12%, rgba(100, 217, 255, 0.26), transparent 36%),
    linear-gradient(165deg, #140b22 0%, #0f081c 48%, #15091f 100%);
  color: #f5ecff;
  font-family: Manrope, ui-sans-serif, system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 48px;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, #ff6b8f, #a83cff, #ff9a3c);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.75;
  pointer-events: none;
}

.eyebrow {
  font-size: 28px;
  letter-spacing: 0.18em;
  font-weight: 800;
  color: #d5bdf8;
  margin-bottom: 24px;
}

h1 {
  margin: 0;
  font-size: 88px;
  line-height: 1.04;
  max-width: 90%;
}

p {
  margin: 28px 0 0;
  max-width: 82%;
  font-size: 34px;
  line-height: 1.35;
  color: rgba(235, 223, 255, 0.88);
}

.footer {
  margin-top: 40px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.pill {
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 20px;
  font-weight: 700;
  color: #f7e9ff;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(39, 24, 62, 0.78);
}`;

function createLibraryItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `studio-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function sanitizeCode(input: string) {
  return input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
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

function StudioCanvas({
  html,
  css,
  width,
  height,
  className,
}: {
  html: string;
  css: string;
  width: number;
  height: number;
  className?: string;
}) {
  const safeHtml = useMemo(() => sanitizeCode(html), [html]);
  const safeCss = useMemo(() => sanitizeCode(css), [css]);
  const scopedCss = useMemo(() => scopeStudioCss(safeCss), [safeCss]);

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
      `}</style>
      <div
        className="studio-canvas-root"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}

export function PostStudio() {
  const [presetKey, setPresetKey] = useState<StudioPresetKey>("feedPortrait");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [htmlLibrary, setHtmlLibrary] = useState<StudioLibraryItem[]>([]);
  const [cssLibrary, setCssLibrary] = useState<StudioLibraryItem[]>([]);
  const [htmlEntryName, setHtmlEntryName] = useState("");
  const [cssEntryName, setCssEntryName] = useState("");
  const [selectedHtmlId, setSelectedHtmlId] = useState("");
  const [selectedCssId, setSelectedCssId] = useState("");
  const [librariesHydrated, setLibrariesHydrated] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const preset = STUDIO_PRESETS.find((item) => item.key === presetKey) ?? STUDIO_PRESETS[0]!;
  const previewScale = Math.min(1, 380 / preset.width, 560 / preset.height);
  const previewWidth = Math.round(preset.width * previewScale);
  const previewHeight = Math.round(preset.height * previewScale);

  useEffect(() => {
    setHtmlLibrary(readLibraryItems(STUDIO_HTML_LIBRARY_KEY));
    setCssLibrary(readLibraryItems(STUDIO_CSS_LIBRARY_KEY));
    setLibrariesHydrated(true);
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

  function saveLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const content = kind === "html" ? html.trim() : css.trim();
    const name = (kind === "html" ? htmlEntryName : cssEntryName).trim();

    if (!name) {
      setErrorMessage(`Informe um nome para ${kind === "html" ? "a estrutura" : "o estilo"}.`);
      return;
    }

    if (!content) {
      setErrorMessage(`Nao ha conteudo de ${kind === "html" ? "HTML" : "CSS"} para salvar.`);
      return;
    }

    const setItems = kind === "html" ? setHtmlLibrary : setCssLibrary;
    const currentItems = kind === "html" ? htmlLibrary : cssLibrary;
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

  function loadSelectedLibraryEntry(kind: "html" | "css") {
    setErrorMessage(null);
    setSuccessMessage(null);

    const selectedId = kind === "html" ? selectedHtmlId : selectedCssId;
    const items = kind === "html" ? htmlLibrary : cssLibrary;

    const found = items.find((item) => item.id === selectedId);
    if (!found) {
      setErrorMessage(`Selecione ${kind === "html" ? "uma estrutura" : "um estilo"} para carregar.`);
      return;
    }

    if (kind === "html") {
      setHtml(found.content);
      setHtmlEntryName(found.name);
    } else {
      setCss(found.content);
      setCssEntryName(found.name);
    }

    setSuccessMessage(`${kind === "html" ? "Estrutura" : "Estilo"} carregado.`);
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
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 1,
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
            <p className="mt-1 text-sm text-[var(--muted)]">
              Monte posts estaticos em codigo e baixe como imagem PNG.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 self-end">
              <span className="px-1 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
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
            </label>

            <Button
              className="self-end"
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

            <Button className="self-end" disabled={isDownloading} onClick={handleDownloadPng}>
              <Download className="h-4 w-4" />
              {isDownloading ? "Gerando..." : "Baixar PNG"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <section className="panel-soft p-4 md:p-5">
          <div className="mb-4 grid gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(15,10,28,0.7)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-1.5 text-[var(--muted-soft)]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Estruturas (HTML)
                  </p>
                  <p className="text-xs text-[var(--muted)]">Salve layouts para reutilizar depois.</p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <select
                    className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                    onChange={(event) => setSelectedHtmlId(event.target.value)}
                    value={selectedHtmlId}
                  >
                    <option value="">Selecione uma estrutura salva</option>
                    {htmlLibrary.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <Button onClick={() => loadSelectedLibraryEntry("html")} size="sm" variant="outline">
                    Carregar
                  </Button>

                  <Button onClick={() => removeSelectedLibraryEntry("html")} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    onChange={(event) => setHtmlEntryName(event.target.value)}
                    placeholder="Nome da estrutura"
                    value={htmlEntryName}
                  />
                  <Button onClick={() => saveLibraryEntry("html")} size="sm" variant="secondary">
                    <Save className="h-4 w-4" />
                    Salvar HTML
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
                  <p className="text-xs text-[var(--muted)]">Guarde seus temas e variações visuais.</p>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <select
                    className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                    onChange={(event) => setSelectedCssId(event.target.value)}
                    value={selectedCssId}
                  >
                    <option value="">Selecione um estilo salvo</option>
                    {cssLibrary.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <Button onClick={() => loadSelectedLibraryEntry("css")} size="sm" variant="outline">
                    Carregar
                  </Button>

                  <Button onClick={() => removeSelectedLibraryEntry("css")} size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4 text-[#ff5f8c]" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    onChange={(event) => setCssEntryName(event.target.value)}
                    placeholder="Nome do estilo"
                    value={cssEntryName}
                  />
                  <Button onClick={() => saveLibraryEntry("css")} size="sm" variant="secondary">
                    <Save className="h-4 w-4" />
                    Salvar CSS
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                HTML (sem JavaScript)
              </label>
              <Textarea
                className="min-h-[340px] font-mono text-xs leading-5"
                onChange={(event) => setHtml(event.target.value)}
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
            <div className="mt-4 rounded-xl border border-[#8a3c58] bg-[rgba(72,20,36,0.35)] px-3 py-2 text-sm text-[#ffd1dd]">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded-xl border border-[rgba(25,195,125,0.32)] bg-[rgba(18,56,42,0.32)] px-3 py-2 text-sm text-[#b7f4d9]">
              {successMessage}
            </div>
          ) : null}
        </section>

        <section className="panel-soft p-4">
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

          <div className="rounded-2xl border border-[var(--border)] bg-[rgba(13,9,22,0.9)] p-3">
            <div
              className="mx-auto overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,7,15,0.92)] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
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
                <StudioCanvas css={css} height={preset.height} html={html} width={preset.width} />
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            Use apenas HTML/CSS estatico. Scripts sao ignorados no preview/export.
          </p>
        </section>
      </div>

      <div className="pointer-events-none fixed -left-[99999px] top-0">
        <div ref={exportRef}>
          <StudioCanvas css={css} height={preset.height} html={html} width={preset.width} />
        </div>
      </div>
    </div>
  );
}
