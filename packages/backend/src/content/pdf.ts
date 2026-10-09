// The regulation itself often lives in a PDF next to the notice: a 发改委令 page carries only the
// promulgating sentence and links the text as an attachment, and so does a 能源局 case bulletin. Reading
// that attachment is the difference between a titled announcement and the document's actual clauses.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseHTML } from "linkedom";

/** A government attachment is a scanned-free text PDF; these bounds keep one odd file from stalling a worker. */
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_PDF_PAGES = 80;

/** Attachments served from somewhere else than the page are not followed: an article does not get to name the download. */
export function attachmentLinks(html: string, pageUrl: string): string[] {
  const { document } = parseHTML(html);
  const page = new URL(pageUrl);
  const out: string[] = [];
  for (const a of document.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href || !/\.pdf(?:$|[?#])/i.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    if (url.hostname !== page.hostname) continue;
    if (!out.includes(url.toString())) out.push(url.toString());
  }
  return out;
}

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;
/** A Chinese PDF wraps mid-sentence; joining with nothing keeps the words whole, anything else needs a space. */
function joinLines(lines: string[]): string {
  let out = "";
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (!out) { out = t; continue; }
    const prev = out[out.length - 1]!;
    out += (CJK.test(prev) && CJK.test(t[0]!)) ? t : " " + t;
  }
  return out;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
/** Plain PDF text as paragraphs: no structure to recover, so nothing is invented. */
export function pdfHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => "<p>" + block.replace(/[&<>"]/g, (c) => ESCAPES[c]!) + "</p>")
    .join("\n");
}

/** The text of a PDF attachment, or null when it is not a readable text PDF (scans, encryption, malformed). */
export async function pdfText(bytes: Uint8Array): Promise<string | null> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PDF_BYTES) return null;
  let doc: Awaited<ReturnType<typeof getDocument>["promise"]> | undefined;
  try {
    doc = await getDocument({ data: bytes, useSystemFonts: false, isEvalSupported: false, disableFontFace: true }).promise;
    const lines: string[] = [];
    for (let page = 1; page <= Math.min(doc.numPages, MAX_PDF_PAGES); page += 1) {
      const content = await (await doc.getPage(page)).getTextContent();
      for (const item of content.items) {
        if (!("str" in item) || typeof item.str !== "string") continue;
        lines.push(item.hasEOL ? item.str + "\n" : item.str);
      }
    }
    const text = joinLines(lines).replace(/[ \t]{2,}/g, " ").trim();
    return text.length >= 200 ? text : null;
  } catch {
    // A malformed or scanned PDF is not this article's failure: the caller keeps what it already has.
    return null;
  } finally {
    await doc?.destroy().catch(() => {});
  }
}