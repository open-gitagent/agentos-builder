import { ReactNode, useState } from "react";
import { Upload, X, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-foreground">
          {label} {required && <span className="text-[hsl(22,70%,45%)]">*</span>}
        </span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputBase =
  "w-full px-3 py-2 text-sm rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={cn(inputBase, "font-mono", props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "resize-y min-h-[80px] leading-relaxed", props.className)} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, "appearance-none bg-no-repeat bg-[right_0.7rem_center] pr-8", props.className)} style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='hsl(25 30% 35%)' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")` }}>
      {children}
    </select>
  );
}

export function FileDrop({ accept = ".pdf,.png,.jpg,.jpeg", multiple = true }: { accept?: string; multiple?: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    setFiles(prev => [...prev, ...Array.from(list)]);
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed rounded-lg px-5 py-6 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border bg-muted/20"
        )}
      >
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <div className="text-sm text-foreground font-medium">Drag & drop files, or <label className="text-primary cursor-pointer hover:underline">browse
          <input type="file" multiple={multiple} accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
        </label></div>
        <div className="text-[11px] text-muted-foreground mt-1">PDF, JPG, PNG up to 10 MB each · the agent will OCR and parse line-items</div>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border">
              <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
              <button onClick={() => setFiles(prev => prev.filter((_, k) => k !== i))} className="text-muted-foreground hover:text-[hsl(0,50%,40%)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SubmitRow({ submitLabel = "Submit request", secondary }: { submitLabel?: string; secondary?: ReactNode }) {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-4">
      {secondary}
      <button
        type="button"
        onClick={() => { setSubmitted(true); setTimeout(() => setSubmitted(false), 2400); }}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-md transition-colors",
          submitted ? "bg-[hsl(155,35%,32%)] text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        data-testid="button-submit-request"
      >
        {submitted ? "Submitted — ticket created" : (<><Send className="w-3.5 h-3.5" /> {submitLabel}</>)}
      </button>
    </div>
  );
}
