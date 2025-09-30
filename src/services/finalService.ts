// src/services/finalService.ts
import api from './api';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface FinalizeResponse {
  success: boolean;
  message: string;
  finalProposal?: {
    _id: string;
    negotiationId?: string | null;
    proposalId?: string | null;
    topicKey?: string | null;
    content: string;
    normalizedWeights?: Record<string, number>;
    participants?: Array<{ _id: string; name: string; role: string }>;
    derivedFromProposals?: Array<{ _id: string; title: string; status: string }>;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface ConsolidatedFilters {
  topicKey?: string;
  /** ISO 8601, e.g. "2025-08-31T23:59:59.000Z" */
  since?: string | Date;
  /** ISO 8601 */
  until?: string | Date;
}

export type ConsolidatedFormat = 'srs' | 'plain';
export type ConsolidatedOutput = 'md' | 'docx' | 'pdf';

// Aliases (older callers)
export type SrsFormat = ConsolidatedFormat;
export type SrsOutput = ConsolidatedOutput;

/**
 * Optional Gemini polish:
 * - true/"gemini"/"md" => polish full Markdown text (IDs preserved)
 * - "fr"               => polish only FR titles/desc before rendering
 * - false/undefined    => no polish
 */
export type PolishMode = boolean | 'gemini' | 'md' | 'fr' | undefined;

/* -------------------------------------------------------------------------- */
/* Utils                                                                       */
/* -------------------------------------------------------------------------- */

const toISO = (v?: string | Date) =>
  v ? (v instanceof Date ? v.toISOString() : v) : undefined;

const getFilenameFromCD = (cd?: string, fallback = 'download.txt') => {
  if (!cd) return fallback;
  // RFC-5987 filename*=
  const star = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(cd);
  if (star && star[2]) return decodeURIComponent(star[2].trim());

  // Fallback: filename=
  const m = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(cd);
  if (!m || !m[1]) return fallback;
  return m[1].replace(/^["']|["']$/g, '');
};

const isBrowser = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

const saveBlobBrowser = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const arrayBufferToText = (buf: ArrayBuffer) =>
  new TextDecoder('utf-8').decode(new Uint8Array(buf));

/** Public helper (kept for compatibility) */
export const saveBlob = (blob: Blob, filename: string) =>
  saveBlobBrowser(blob, filename);

/** Normalize any incoming polish value to a concrete mode or 'none'. */
const normalizePolish = (
  p: PolishMode | string | undefined
): 'md' | 'gemini' | 'fr' | 'none' => {
  if (p === true || p === 'true') return 'md'; // legacy truthy → default mode
  if (p === 'md' || p === 'gemini' || p === 'fr') return p;
  return 'none';
};

/* -------------------------------------------------------------------------- */
/* Finalize single proposal                                                    */
/* -------------------------------------------------------------------------- */

export const finalizeProposal = async (
  proposalId: string,
  opts?: { idempotencyKey?: string; signal?: AbortSignal }
): Promise<FinalizeResponse> => {
  const headers = opts?.idempotencyKey
    ? { 'X-Idempotency-Key': opts.idempotencyKey }
    : undefined;
  const { data } = await api.post<FinalizeResponse>(
    `/finalize/${encodeURIComponent(proposalId)}`,
    null,
    { headers, signal: opts?.signal }
  );
  return data;
};

// Alias endpoint (optional to expose separately)
export const finalizeProposalAlias = async (
  proposalId: string,
  opts?: { idempotencyKey?: string; signal?: AbortSignal }
): Promise<FinalizeResponse> => {
  const headers = opts?.idempotencyKey
    ? { 'X-Idempotency-Key': opts.idempotencyKey }
    : undefined;
  const { data } = await api.post<FinalizeResponse>(
    `/finalize/one/${encodeURIComponent(proposalId)}`,
    null,
    { headers, signal: opts?.signal }
  );
  return data;
};

/* -------------------------------------------------------------------------- */
/* Final artifact (single negotiation)                                         */
/* -------------------------------------------------------------------------- */

/** Download the .txt artifact to disk (browser) or return the filename/content (SSR). */
export const downloadFinalArtifact = async (
  negotiationId: string,
  opts?: { filename?: string; signal?: AbortSignal }
) => {
  const path = `/final-proposals/${encodeURIComponent(negotiationId)}/download`;

  if (isBrowser()) {
    const res = await api.get(path, {
      responseType: 'blob',
      headers: { Accept: 'text/plain' },
      signal: opts?.signal,
    });
    const cd = (res.headers as any)['content-disposition'] as string | undefined;
    const fname = opts?.filename ?? getFilenameFromCD(cd, `${negotiationId}.txt`);
    saveBlobBrowser(res.data as Blob, fname);
    return { filename: fname };
  }

  // SSR: return text content for persistence
  const res = await api.get<ArrayBuffer>(path, {
    responseType: 'arraybuffer',
    headers: { Accept: 'text/plain' },
    signal: opts?.signal,
  });
  const cd = (res.headers as any)['content-disposition'] as string | undefined;
  const fname = opts?.filename ?? getFilenameFromCD(cd, `${negotiationId}.txt`);
  return { filename: fname, content: arrayBufferToText(res.data) };
};

/** Fetch the final artifact text (no download) for preview. */
export const getFinalArtifactText = async (
  negotiationId: string,
  opts?: { signal?: AbortSignal }
): Promise<string> => {
  const path = `/final-proposals/${encodeURIComponent(negotiationId)}/download`;

  if (isBrowser()) {
    const res = await api.get(path, {
      responseType: 'blob',
      headers: { Accept: 'text/plain' },
      signal: opts?.signal,
    });
    const blob = res.data as Blob;
    return await blob.text();
  }

  const res = await api.get<ArrayBuffer>(path, {
    responseType: 'arraybuffer',
    headers: { Accept: 'text/plain' },
    signal: opts?.signal,
  });
  return arrayBufferToText(res.data);
};

/** Get the FinalProposal JSON for a negotiation (non-download). */
export const getFinalProposalByNegotiation = async (
  negotiationId: string,
  opts?: { signal?: AbortSignal }
) => {
  const { data } = await api.get<{ finalProposal: FinalizeResponse['finalProposal'] }>(
    `/final-proposals/${encodeURIComponent(negotiationId)}`,
    { signal: opts?.signal }
  );
  return data.finalProposal;
};

/* -------------------------------------------------------------------------- */
/* Consolidated SRS / exports                                                  */
/* -------------------------------------------------------------------------- */

const acceptForOutput = (output: ConsolidatedOutput) => {
  switch (output) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'pdf':
      return 'application/pdf';
    default:
      // Controller serves Markdown as text/plain
      return 'text/plain';
  }
};

const defaultFilenameForOutput = (output: ConsolidatedOutput) => {
  switch (output) {
    case 'docx':
      return 'SRS.docx';
    case 'pdf':
      return 'SRS.pdf';
    default:
      return 'SRS.md';
  }
};

const consolidatedQuery = (filters?: ConsolidatedFilters) => {
  const params: Record<string, string> = {};
  if (filters?.topicKey) params.topicKey = filters.topicKey;
  const since = toISO(filters?.since);
  const until = toISO(filters?.until);
  if (since) params.since = since;
  if (until) params.until = until;
  return params;
};

const buildConsolidatedParams = (
  filters?: ConsolidatedFilters,
  format: ConsolidatedFormat = 'srs',
  output: ConsolidatedOutput = 'md',
  polish?: PolishMode,
  download?: boolean
) => {
  const params: Record<string, string | boolean> = {
    ...consolidatedQuery(filters),
    format,
    output,
  };

  // ✅ Normalize polish once (supports legacy "true")
  const mode = normalizePolish(polish);
  if (mode !== 'none') {
    params.polish = mode;
  }

  if (typeof download === 'boolean') params.download = download;
  return params;
};

/**
 * Export consolidated SRS.
 * - format: 'srs' (default) or 'plain'
 * - output: 'md' | 'docx' | 'pdf'
 * - polish: true | 'gemini' | 'md' | 'fr' | false
 * - download: boolean (hints server to set Content-Disposition attachment/inline)
 *
 * Browser: triggers a file save.
 * SSR: returns { filename, content? | buffer? } for you to persist.
 */
export const exportConsolidated = async (opts?: {
  filters?: ConsolidatedFilters;
  format?: ConsolidatedFormat;
  output?: ConsolidatedOutput;
  polish?: PolishMode;
  download?: boolean;
  filename?: string;
  signal?: AbortSignal;
}) => {
  const format = opts?.format ?? 'srs';
  const output = opts?.output ?? 'md';
  const params = buildConsolidatedParams(
    opts?.filters,
    format,
    output,
    opts?.polish,
    // When we trigger a browser save, it’s friendlier if server suggests attachment
    typeof opts?.download === 'boolean' ? opts.download : true
  );

  const accept = acceptForOutput(output);
  const path = '/finalize/consolidated';

  if (isBrowser()) {
    const res = await api.get(path, {
      params,
      responseType: 'blob',
      headers: { Accept: accept },
      signal: opts?.signal,
    });
    const cd = (res.headers as any)['content-disposition'] as string | undefined;
    const fname =
      opts?.filename ?? getFilenameFromCD(cd, defaultFilenameForOutput(output));
    saveBlobBrowser(res.data as Blob, fname);
    return { filename: fname };
  }

  // SSR
  const res = await api.get<ArrayBuffer>(path, {
    params,
    responseType: 'arraybuffer',
    headers: { Accept: accept },
    signal: opts?.signal,
  });
  const cd = (res.headers as any)['content-disposition'] as string | undefined;
  const fname =
      opts?.filename ?? getFilenameFromCD(cd, defaultFilenameForOutput(output));

  if (output === 'md' || format === 'plain') {
    // text payload
    return { filename: fname, content: arrayBufferToText(res.data) };
  }

  // binary payload (docx/pdf) — ✅ no Node Buffer
  return { filename: fname, buffer: new Uint8Array(res.data) };
};

/**
 * Convenience: get consolidated Markdown (string) for preview/search.
 * (Uses format='srs', output='md'. Set polish to 'md'/'gemini' to request Gemini-polished markdown.)
 */
export const getConsolidatedMarkdownText = async (
  filters?: ConsolidatedFilters,
  opts?: { polish?: Extract<PolishMode, boolean | 'gemini' | 'md'>; signal?: AbortSignal }
): Promise<string> => {
  const params = buildConsolidatedParams(filters, 'srs', 'md', opts?.polish, false);
  const path = '/finalize/consolidated';

  if (isBrowser()) {
    const res = await api.get(path, {
      params,
      responseType: 'blob',
      headers: { Accept: 'text/plain' },
      signal: opts?.signal,
    });
    const blob = res.data as Blob;
    return await blob.text();
  }

  const res = await api.get<ArrayBuffer>(path, {
    params,
    responseType: 'arraybuffer',
    headers: { Accept: 'text/plain' },
    signal: opts?.signal,
  });
  return arrayBufferToText(res.data);
};

/* ---------- Compat wrappers (older names used in UI) ---------------------- */

/** Legacy: download consolidated (txt) using default SRS/MD. */
export const downloadConsolidated = async (
  filters?: ConsolidatedFilters,
  opts?: { filename?: string; signal?: AbortSignal }
) => {
  return exportConsolidated({
    filters,
    format: 'srs',
    output: 'md',
    filename: opts?.filename,
    signal: opts?.signal,
  });
};

/** Legacy: get consolidated as text (no download). */
export const getConsolidatedText = async (
  filters?: ConsolidatedFilters,
  opts?: { signal?: AbortSignal }
): Promise<string> => {
  return getConsolidatedMarkdownText(filters, { signal: opts?.signal });
};

/* ---------- Advanced helper exactly as requested -------------------------- */

export const downloadConsolidatedAdvanced = async (
  filters?: ConsolidatedFilters,
  opts?: {
    format?: ConsolidatedFormat;   // default 'srs'
    output?: ConsolidatedOutput;   // default 'md'
    filename?: string;
    signal?: AbortSignal;
    download?: boolean;            // server: attachment vs inline (default true)
  }
) => {
  const path = '/finalize/consolidated';
  const params: any = consolidatedQuery(filters);
  params.format = (opts?.format ?? 'srs');
  params.output = (opts?.output ?? 'md');
  params.download = String(opts?.download ?? true);

  const accept = acceptForOutput(params.output as ConsolidatedOutput);

  if (isBrowser()) {
    const res = await api.get(path, {
      params,
      responseType: 'blob',
      headers: { Accept: accept },
      signal: opts?.signal,
    });
    const cd = (res.headers as any)['content-disposition'] as string | undefined;
    const fallback = defaultFilenameForOutput(params.output as ConsolidatedOutput);
    const fname = opts?.filename ?? getFilenameFromCD(cd, fallback);
    saveBlobBrowser(res.data as Blob, fname);
    return { filename: fname };
  }

  const res = await api.get<ArrayBuffer>(path, {
    params,
    responseType: 'arraybuffer',
    headers: { Accept: accept },
    signal: opts?.signal,
  });
  const cd = (res.headers as any)['content-disposition'] as string | undefined;
  const fallback = defaultFilenameForOutput(params.output as ConsolidatedOutput);
  const fname = opts?.filename ?? getFilenameFromCD(cd, fallback);
  // Keep advanced API shape: return raw ArrayBuffer in 'content'
  return { filename: fname, content: res.data };
};

/* -------------------------------------------------------------------------- */
/* Legacy consolidated (txt)                                                   */
/* -------------------------------------------------------------------------- */

export const downloadConsolidatedLegacy = async (
  opts?: { filename?: string; signal?: AbortSignal }
) => {
  const path = '/finalize/consolidated-legacy';

  if (isBrowser()) {
    const res = await api.get(path, {
      responseType: 'blob',
      headers: { Accept: 'text/plain' },
      signal: opts?.signal,
    });
    const cd = (res.headers as any)['content-disposition'] as string | undefined;
    const fname =
      opts?.filename ?? getFilenameFromCD(cd, 'consolidated-finalized-legacy.txt');
    saveBlobBrowser(res.data as Blob, fname);
    return { filename: fname };
  }

  const res = await api.get<ArrayBuffer>(path, {
    responseType: 'arraybuffer',
    headers: { Accept: 'text/plain' },
    signal: opts?.signal,
  });
  const cd = (res.headers as any)['content-disposition'] as string | undefined;
  const fname =
    opts?.filename ?? getFilenameFromCD(cd, 'consolidated-finalized-legacy.txt');
  return { filename: fname, content: arrayBufferToText(res.data) };
};
