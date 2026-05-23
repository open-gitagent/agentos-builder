export interface UploadedFileWithContent {
  name: string;
  size: string;
  content: string;
}

const TEXT_EXTENSIONS = new Set([
  ".csv", ".tsv", ".txt", ".json", ".xml", ".yaml", ".yml",
  ".md", ".log", ".sql", ".html", ".htm", ".xbrl",
]);

const SERVER_PARSED_EXTENSIONS = new Set([".pdf"]);

function getExt(name: string): string {
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx < 0) return "";
  return name.slice(dotIdx).toLowerCase();
}

function isTextFile(name: string): boolean {
  return TEXT_EXTENSIONS.has(getExt(name));
}

function isServerParsed(name: string): boolean {
  return SERVER_PARSED_EXTENSIONS.has(getExt(name));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function extractViaServer(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
  );
  const baseUrl = import.meta.env.BASE_URL || "/";
  const resp = await fetch(`${baseUrl}api/files/extract-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: file.name, data: base64 }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Server error" }));
    return `[Could not extract text from ${file.name}: ${err.error}]`;
  }
  const result = await resp.json();
  if (result.error) {
    return `[${result.error}]`;
  }
  return result.text || `[No text content found in ${file.name}]`;
}

export async function readUploadedFiles(fileList: FileList): Promise<UploadedFileWithContent[]> {
  const files = Array.from(fileList);
  const results = await Promise.all(
    files.map(async (file): Promise<UploadedFileWithContent> => {
      const entry: UploadedFileWithContent = {
        name: file.name,
        size: formatSize(file.size),
        content: "",
      };

      if (file.size > MAX_FILE_SIZE) {
        entry.content = `[File too large: ${file.name} (${entry.size}) — max 5MB]`;
      } else if (isTextFile(file.name)) {
        try {
          entry.content = await file.text();
        } catch {
          entry.content = `[Could not read file: ${file.name}]`;
        }
      } else if (isServerParsed(file.name)) {
        try {
          entry.content = await extractViaServer(file);
        } catch {
          entry.content = `[Could not extract text from ${file.name}]`;
        }
      } else {
        const ext = getExt(file.name);
        if (ext === ".xlsx" || ext === ".xls" || ext === ".docx") {
          entry.content = `[Unsupported format: ${file.name} — please export as CSV or PDF]`;
        } else {
          entry.content = `[Unsupported format: ${file.name} — upload CSV, JSON, TXT, XML, YAML, or PDF files]`;
        }
      }

      return entry;
    })
  );

  return results;
}
