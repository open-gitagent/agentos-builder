import { Router } from "express";
import { PDFParse } from "pdf-parse";

const router = Router();

router.post("/files/extract-text", async (req, res) => {
  const { name, data } = req.body as { name: string; data: string };

  if (!name || !data) {
    res.status(400).json({ error: "name and data (base64) are required" });
    return;
  }

  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();

  try {
    if (ext === ".pdf") {
      const buffer = Buffer.from(data, "base64");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const text = (result?.text || "").replace(/\n-- \d+ of \d+ --\n/g, "\n").trim();
      parser.destroy();
      if (!text) {
        res.json({ text: "", error: "PDF contained no extractable text (may be scanned/image-based)" });
        return;
      }
      console.log(`[File Extract] PDF "${name}": ${text.length} chars extracted from ${result.total} pages`);
      res.json({ text });
      return;
    }

    res.status(400).json({ error: `Unsupported format: ${ext}` });
  } catch (err: unknown) {
    console.error(`[File Extract] Error parsing ${name}:`, err);
    res.status(500).json({ error: `Failed to extract text from ${name}` });
  }
});

export default router;
