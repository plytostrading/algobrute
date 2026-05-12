'use client';

/**
 * AttachmentButton — Wave Q.2.B (B4) artifact-attachment composer surface.
 *
 * Customers attach one of five artifact types alongside their dialogue
 * input.  The engine's Detective agent has been ready to consume these
 * all along (see ``algobrute.origination.tool_sanitization`` —
 * ``sanitize_artifact_content`` strips imperative-injection patterns,
 * then hybrid heuristic + LLM classification threads through); the
 * frontend just had no UI for it.
 *
 * Attachment-type → engine ``ArtifactSourceType`` mapping:
 *   - PineScript paste → ``pinescript``
 *   - Paper PDF upload → ``pdf`` (base64-encoded)
 *   - Chart screenshot → ``chart_annotation`` (base64-encoded image)
 *   - Composer JSON   → ``generic`` (JSON-validated, raw text)
 *   - Reference URL   → ``video_transcript`` (research / video links)
 *
 * Single-attachment-at-a-time semantics: the parent ``OriginateChat``
 * holds the pending attachment in state and clears it on send.  This
 * component is stateless w.r.t. send lifecycle — it accepts the
 * current attachment as a controlled prop and reports changes via
 * ``onChange``.
 *
 * Size discipline: the engine's ``DialogueStreamHandshake`` Pydantic
 * model caps ``artifact_content`` at 200_000 characters (see
 * ``src/algobrute/api/routers/dialogue_stream.py:168``).  This
 * component renders a live byte-counter on every form so customers see
 * they're approaching the limit BEFORE submission fails; the parent
 * hook does a second authoritative check on send.
 */

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import {
  Paperclip,
  X,
  FileText,
  FileImage,
  FileJson,
  Link as LinkIcon,
  Code2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ARTIFACT_CONTENT_MAX_CHARS,
  type DialogueAttachmentPayload,
} from '@/hooks/useDialogueSession';
import { cn } from '@/lib/utils';

/** Wave Q.2.B (B4) — five-way artifact-source taxonomy.
 *
 * Maps 1:1 to the engine's ``ArtifactSourceType`` enum values.  Kept as
 * a local TS literal union (not a re-imported enum) so the UI layer
 * does not depend on the Python contract directly; the values are
 * verified against the engine source at type-definition time. */
type AttachmentTab = 'pinescript' | 'paper' | 'chart' | 'composer' | 'url';

interface TabSpec {
  /** Tab id (matches the ``Tabs`` ``value``). */
  id: AttachmentTab;
  /** Human-readable label rendered in the tab trigger. */
  label: string;
  /** Short description rendered inside the tab body. */
  description: string;
  /** Icon component (Lucide). */
  Icon: ComponentType<{ className?: string }>;
  /** Engine-facing ``artifact_source_type`` value. */
  sourceType: string;
}

const TAB_SPECS: TabSpec[] = [
  {
    id: 'pinescript',
    label: 'PineScript',
    description:
      'Paste TradingView Pine code — Detective will infer the strategy intent and surface relevant indicators.',
    Icon: Code2,
    sourceType: 'pinescript',
  },
  {
    id: 'paper',
    label: 'Paper PDF',
    description:
      'Upload a research paper or strategy book chapter (PDF, base64-encoded for transit).',
    Icon: FileText,
    sourceType: 'pdf',
  },
  {
    id: 'chart',
    label: 'Chart',
    description:
      'Upload a chart screenshot — Detective will OCR pattern labels and annotation text.',
    Icon: FileImage,
    sourceType: 'chart_annotation',
  },
  {
    id: 'composer',
    label: 'Composer JSON',
    description:
      'Upload a Composer.trade strategy export (JSON).  Detective will parse the symphony tree.',
    Icon: FileJson,
    sourceType: 'generic',
  },
  {
    id: 'url',
    label: 'Reference URL',
    description:
      'Link to a research blog post, video, or paper.  Detective treats it as a video-transcript-class reference.',
    Icon: LinkIcon,
    sourceType: 'video_transcript',
  },
];

/** Bytes → human-readable size string ("12 KB", "456 B"). */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Wave Q.2.B (B4) — render a file as a base64-encoded data string.
 *
 * The engine's sanitizer treats binary artifacts as text — we encode
 * the bytes as ``base64`` (no data:URL prefix) so the cleaned_text
 * downstream survives the ``200_000`` char ceiling for any artifact up
 * to ~150KB raw size (base64 inflates by ~4/3).
 */
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Reader returned non-string result.'));
        return;
      }
      // ``readAsDataURL`` yields ``data:<mime>;base64,<payload>`` — strip
      // the prefix so the engine gets the pure base64 string.
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

/** Read a file as plain text (used for Composer JSON validation). */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Reader returned non-string result.'));
        return;
      }
      resolve(result);
    };
    reader.readAsText(file);
  });
}

/** Loose URL validation — accept ``http(s)://...`` only.  Rejecting at
 *  the UI layer keeps obviously-invalid input from ever leaving the
 *  browser; the engine does its own host whitelist downstream. */
function isLikelyUrl(s: string): boolean {
  try {
    const url = new URL(s.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface AttachmentButtonProps {
  /** Currently-pending attachment held by the parent composer (one at a
   *  time).  Rendered as the preview chip and primed-state of the
   *  button. */
  attachment: DialogueAttachmentPayload | null;
  /** Set or clear the pending attachment.  ``null`` detaches. */
  onChange: (attachment: DialogueAttachmentPayload | null) => void;
  /** Disable the button while the parent is mid-send / connection-busy. */
  disabled?: boolean;
}

export default function AttachmentButton({
  attachment,
  onChange,
  disabled,
}: AttachmentButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AttachmentTab>('pinescript');

  // Per-tab in-progress drafts.  Drafts are local-only so opening the
  // sheet on a fresh attachment doesn't clobber a half-typed paste.
  // They reset when the sheet closes via ``onOpenChange``.
  const [pineDraft, setPineDraft] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('');

  // Reading-in-progress + per-tab error surfaces.
  const [reading, setReading] = useState<AttachmentTab | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);

  // Clear drafts when the sheet closes (also clears the success state
  // after submit since the sheet auto-closes).
  useEffect(() => {
    if (!open) {
      setPineDraft('');
      setUrlDraft('');
      setPdfFile(null);
      setImageFile(null);
      setJsonFile(null);
      setJsonText('');
      setTabError(null);
      setReading(null);
    }
  }, [open]);

  /** Common submission helper — validate then push to parent. */
  const submit = useCallback(
    (payload: DialogueAttachmentPayload) => {
      if (payload.content.length > ARTIFACT_CONTENT_MAX_CHARS) {
        setTabError(
          `Content too large — ${payload.content.length.toLocaleString()} ` +
            `chars exceeds the ${ARTIFACT_CONTENT_MAX_CHARS.toLocaleString()} ` +
            `char limit.  Please trim or split.`,
        );
        return;
      }
      onChange(payload);
      setOpen(false);
    },
    [onChange],
  );

  const handlePineSubmit = useCallback(() => {
    setTabError(null);
    if (!pineDraft.trim()) {
      setTabError('Paste some Pine code before submitting.');
      return;
    }
    submit({
      content: pineDraft,
      sourceType: 'pinescript',
      label: 'PineScript paste',
    });
  }, [pineDraft, submit]);

  const handleUrlSubmit = useCallback(() => {
    setTabError(null);
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setTabError('Paste a URL before submitting.');
      return;
    }
    if (!isLikelyUrl(trimmed)) {
      setTabError('Not a valid http(s) URL.');
      return;
    }
    submit({
      content: trimmed,
      sourceType: 'video_transcript',
      label: 'Reference URL',
    });
  }, [urlDraft, submit]);

  const handlePdfSubmit = useCallback(async () => {
    setTabError(null);
    if (!pdfFile) {
      setTabError('Choose a PDF file before submitting.');
      return;
    }
    try {
      setReading('paper');
      const content = await readFileAsBase64(pdfFile);
      submit({
        content,
        sourceType: 'pdf',
        label: pdfFile.name,
      });
    } catch (err) {
      setTabError(err instanceof Error ? err.message : 'Failed to read file.');
    } finally {
      setReading(null);
    }
  }, [pdfFile, submit]);

  const handleChartSubmit = useCallback(async () => {
    setTabError(null);
    if (!imageFile) {
      setTabError('Choose a chart screenshot before submitting.');
      return;
    }
    try {
      setReading('chart');
      const content = await readFileAsBase64(imageFile);
      submit({
        content,
        sourceType: 'chart_annotation',
        label: imageFile.name,
      });
    } catch (err) {
      setTabError(err instanceof Error ? err.message : 'Failed to read file.');
    } finally {
      setReading(null);
    }
  }, [imageFile, submit]);

  const handleComposerSubmit = useCallback(async () => {
    setTabError(null);
    if (!jsonFile && !jsonText.trim()) {
      setTabError('Choose a Composer JSON file or paste the JSON before submitting.');
      return;
    }
    try {
      setReading('composer');
      const raw = jsonFile ? await readFileAsText(jsonFile) : jsonText;
      // Validate JSON before sending — the engine will reject malformed
      // input downstream; surfacing the parse error here saves a turn.
      try {
        JSON.parse(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON.';
        setTabError(`JSON parse failed: ${msg}`);
        return;
      }
      submit({
        content: raw,
        sourceType: 'generic',
        label: jsonFile ? jsonFile.name : 'Composer JSON paste',
      });
    } catch (err) {
      setTabError(err instanceof Error ? err.message : 'Failed to read file.');
    } finally {
      setReading(null);
    }
  }, [jsonFile, jsonText, submit]);

  // ------------------------------------------------------------------
  // Trigger button + preview chip
  // ------------------------------------------------------------------

  const hasAttachment = attachment !== null;
  const previewLabel = attachment?.label ?? '';
  const previewSize = attachment?.content.length ?? 0;

  return (
    <div
      className="flex flex-col gap-1"
      data-testid="originate-attachment-root"
      data-has-attachment={hasAttachment ? 'true' : 'false'}
    >
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              data-testid="originate-attach-button"
              aria-label="Attach an artifact"
              className={cn(
                'h-9 w-9',
                hasAttachment && 'border-primary text-primary',
              )}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-4 overflow-y-auto p-4 sm:max-w-md"
            data-testid="originate-attachment-sheet"
          >
            <SheetHeader className="p-0">
              <SheetTitle>Attach an artifact</SheetTitle>
              <SheetDescription>
                Detective sanitises and classifies what you attach before
                threading it into the dialogue.  Limit:{' '}
                {ARTIFACT_CONTENT_MAX_CHARS.toLocaleString()} characters (≈
                {formatBytes(ARTIFACT_CONTENT_MAX_CHARS)}).
              </SheetDescription>
            </SheetHeader>

            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as AttachmentTab);
                setTabError(null);
              }}
              className="flex flex-col gap-4"
            >
              <TabsList className="grid h-auto grid-cols-5">
                {TAB_SPECS.map((spec) => {
                  const Icon = spec.Icon;
                  return (
                    <TabsTrigger
                      key={spec.id}
                      value={spec.id}
                      data-testid={`originate-attach-tab-${spec.id}`}
                      className="flex flex-col items-center justify-center gap-1 py-2 text-[10px]"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{spec.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* ──────────────────────────────────── PineScript */}
              <TabsContent value="pinescript" className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {TAB_SPECS[0].description}
                </p>
                <Label htmlFor="originate-attach-pinescript">PineScript</Label>
                <textarea
                  id="originate-attach-pinescript"
                  data-testid="originate-attach-pinescript-input"
                  value={pineDraft}
                  onChange={(e) => setPineDraft(e.target.value)}
                  rows={12}
                  placeholder={`//@version=5\nindicator("My script", overlay=true)\n...`}
                  className={cn(
                    'min-h-[240px] w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-xs outline-none',
                    'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  )}
                />
                <ByteCounter
                  bytes={pineDraft.length}
                  testid="originate-attach-pinescript-counter"
                />
                {tabError && activeTab === 'pinescript' && (
                  <ErrorRow
                    message={tabError}
                    testid="originate-attach-pinescript-error"
                  />
                )}
                <Button
                  type="button"
                  onClick={handlePineSubmit}
                  disabled={
                    !pineDraft.trim() ||
                    pineDraft.length > ARTIFACT_CONTENT_MAX_CHARS
                  }
                  data-testid="originate-attach-pinescript-submit"
                >
                  Attach PineScript
                </Button>
              </TabsContent>

              {/* ──────────────────────────────────── Paper PDF */}
              <TabsContent value="paper" className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {TAB_SPECS[1].description}
                </p>
                <Label htmlFor="originate-attach-pdf">Paper PDF</Label>
                <Input
                  id="originate-attach-pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setPdfFile(f);
                    setTabError(null);
                  }}
                  data-testid="originate-attach-pdf-input"
                />
                {pdfFile && (
                  <div
                    className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs"
                    data-testid="originate-attach-pdf-preview"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{pdfFile.name}</span>
                    <span className="text-muted-foreground">
                      {formatBytes(pdfFile.size)}
                    </span>
                  </div>
                )}
                {tabError && activeTab === 'paper' && (
                  <ErrorRow
                    message={tabError}
                    testid="originate-attach-paper-error"
                  />
                )}
                <Button
                  type="button"
                  onClick={handlePdfSubmit}
                  disabled={!pdfFile || reading === 'paper'}
                  data-testid="originate-attach-paper-submit"
                >
                  {reading === 'paper' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reading…
                    </>
                  ) : (
                    'Attach PDF'
                  )}
                </Button>
              </TabsContent>

              {/* ──────────────────────────────────── Chart Screenshot */}
              <TabsContent value="chart" className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {TAB_SPECS[2].description}
                </p>
                <Label htmlFor="originate-attach-chart">Chart screenshot</Label>
                <Input
                  id="originate-attach-chart"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImageFile(f);
                    setTabError(null);
                  }}
                  data-testid="originate-attach-chart-input"
                />
                {imageFile && (
                  <div
                    className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs"
                    data-testid="originate-attach-chart-preview"
                  >
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{imageFile.name}</span>
                    <span className="text-muted-foreground">
                      {formatBytes(imageFile.size)}
                    </span>
                  </div>
                )}
                {tabError && activeTab === 'chart' && (
                  <ErrorRow
                    message={tabError}
                    testid="originate-attach-chart-error"
                  />
                )}
                <Button
                  type="button"
                  onClick={handleChartSubmit}
                  disabled={!imageFile || reading === 'chart'}
                  data-testid="originate-attach-chart-submit"
                >
                  {reading === 'chart' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reading…
                    </>
                  ) : (
                    'Attach screenshot'
                  )}
                </Button>
              </TabsContent>

              {/* ──────────────────────────────────── Composer JSON */}
              <TabsContent value="composer" className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {TAB_SPECS[3].description}
                </p>
                <Label htmlFor="originate-attach-json-file">
                  Composer JSON (upload)
                </Label>
                <Input
                  id="originate-attach-json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setJsonFile(f);
                    if (f) setJsonText('');
                    setTabError(null);
                  }}
                  data-testid="originate-attach-composer-file-input"
                />
                <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or paste JSON
                  <span className="h-px flex-1 bg-border" />
                </div>
                <textarea
                  id="originate-attach-json-paste"
                  data-testid="originate-attach-composer-text-input"
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (e.target.value) setJsonFile(null);
                    setTabError(null);
                  }}
                  rows={8}
                  placeholder={`{"name": "My symphony", "node_type": "root", ...}`}
                  className={cn(
                    'min-h-[160px] w-full resize-y rounded-md border bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-xs outline-none',
                    'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  )}
                />
                <ByteCounter
                  bytes={jsonFile ? jsonFile.size : jsonText.length}
                  testid="originate-attach-composer-counter"
                />
                {tabError && activeTab === 'composer' && (
                  <ErrorRow
                    message={tabError}
                    testid="originate-attach-composer-error"
                  />
                )}
                <Button
                  type="button"
                  onClick={handleComposerSubmit}
                  disabled={
                    (!jsonFile && !jsonText.trim()) || reading === 'composer'
                  }
                  data-testid="originate-attach-composer-submit"
                >
                  {reading === 'composer' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reading…
                    </>
                  ) : (
                    'Attach JSON'
                  )}
                </Button>
              </TabsContent>

              {/* ──────────────────────────────────── Reference URL */}
              <TabsContent value="url" className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {TAB_SPECS[4].description}
                </p>
                <Label htmlFor="originate-attach-url">Reference URL</Label>
                <Input
                  id="originate-attach-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com/research/momentum-strategies"
                  value={urlDraft}
                  onChange={(e) => {
                    setUrlDraft(e.target.value);
                    setTabError(null);
                  }}
                  data-testid="originate-attach-url-input"
                />
                <ByteCounter
                  bytes={urlDraft.length}
                  testid="originate-attach-url-counter"
                />
                {tabError && activeTab === 'url' && (
                  <ErrorRow
                    message={tabError}
                    testid="originate-attach-url-error"
                  />
                )}
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlDraft.trim()}
                  data-testid="originate-attach-url-submit"
                >
                  Attach URL
                </Button>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>

        {/* Pending-attachment preview chip alongside the trigger button. */}
        {hasAttachment && (
          <div
            className="flex max-w-[260px] items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs"
            data-testid="originate-attachment-preview"
          >
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{previewLabel}</span>
            <span className="text-muted-foreground">
              {formatBytes(previewSize)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onChange(null)}
              aria-label="Remove attachment"
              data-testid="originate-attachment-remove"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local helper components
// ---------------------------------------------------------------------------

interface ByteCounterProps {
  bytes: number;
  testid?: string;
}

function ByteCounter({ bytes, testid }: ByteCounterProps) {
  const pct = bytes / ARTIFACT_CONTENT_MAX_CHARS;
  const tone =
    pct >= 1
      ? 'text-destructive'
      : pct >= 0.85
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground';
  return (
    <div
      className={cn('flex items-center justify-between text-[11px]', tone)}
      data-testid={testid}
    >
      <span>
        {bytes.toLocaleString()} /{' '}
        {ARTIFACT_CONTENT_MAX_CHARS.toLocaleString()} characters
      </span>
      <span>
        {formatBytes(bytes)} / {formatBytes(ARTIFACT_CONTENT_MAX_CHARS)}
      </span>
    </div>
  );
}

interface ErrorRowProps {
  message: string;
  testid: string;
}

function ErrorRow({ message, testid }: ErrorRowProps) {
  return (
    <div
      className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      data-testid={testid}
    >
      {message}
    </div>
  );
}
