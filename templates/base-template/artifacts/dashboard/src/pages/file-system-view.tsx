import { useState, useRef } from "react";
import { Folder, FolderOpen, FileText, FileCode, FileJson, ChevronRight, ChevronDown, FolderTree, Upload, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useGetAgentFileTree, useGetAgentFileContent } from "@workspace/api-client-react";

interface TreeNode {
  name: string;
  path: string;
  type: string;
  children?: TreeNode[];
}

function TreeItem({ node, depth, selectedPath, onSelect, onUploadToDir }: { node: TreeNode; depth: number; selectedPath: string | null; onSelect: (path: string) => void; onUploadToDir: (dirPath: string) => void }) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isDir = node.type === "directory";

  if (isDir) {
    return (
      <div className="select-none">
        <div
          className="group flex items-center gap-1.5 py-1.5 px-2 hover:bg-muted/50 rounded cursor-pointer text-sm text-foreground/80"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          {isOpen ? <FolderOpen className="w-4 h-4 text-primary/70" /> : <Folder className="w-4 h-4 text-primary/70" />}
          <span className="font-medium flex-1">{node.name}</span>
          <button
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-primary/10 transition-opacity"
            title={`Upload file to ${node.name}`}
            onClick={(e) => { e.stopPropagation(); onUploadToDir(node.path); }}
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} onUploadToDir={onUploadToDir} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const ext = node.name.split('.').pop() || '';
  const getIcon = () => {
    if (ext === 'json') return <FileJson className="w-4 h-4 text-warning/80" />;
    if (ext === 'py') return <FileCode className="w-4 h-4 text-success/80" />;
    if (ext === 'yaml' || ext === 'yml') return <FileCode className="w-4 h-4 text-purple-500/80" />;
    if (ext === 'md') return <FileText className="w-4 h-4 text-primary/80" />;
    if (ext === 'csv') return <FileText className="w-4 h-4 text-green-600/80" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const isSelected = selectedPath === node.path;

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors",
        isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 14 + 26}px` }}
      onClick={() => onSelect(node.path)}
    >
      {getIcon()}
      {node.name}
    </div>
  );
}

export default function FileSystemView() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [uploadTargetDir, setUploadTargetDir] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const relativePath = selectedPath ? selectedPath.replace(/^agent\//, '') : '';

  const { data: fileTree, refetch: refetchTree } = useGetAgentFileTree();
  const fileContentEnabled = !!selectedPath && relativePath.length > 0;
  const fileContentQuery = useGetAgentFileContent(
    { path: fileContentEnabled ? relativePath : '' },
    fileContentEnabled ? undefined : { query: { enabled: false } as never }
  );
  const fileContent = fileContentEnabled ? fileContentQuery.data : undefined;
  const loading = fileContentEnabled ? fileContentQuery.isLoading : false;

  const handleUploadToDir = (dirPath: string) => {
    setUploadTargetDir(dirPath);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTargetDir) return;

    setUploadStatus("uploading");
    const targetRelative = uploadTargetDir.replace(/^agent\/?/, '');
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const resp = await fetch("/api/agent/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            directory: targetRelative,
            fileName: file.name,
            content,
          }),
        });
        if (resp.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (failCount === 0) {
      setUploadStatus("success");
      setUploadMessage(`${successCount} file${successCount > 1 ? "s" : ""} uploaded to ${uploadTargetDir}`);
    } else {
      setUploadStatus("error");
      setUploadMessage(`${successCount} uploaded, ${failCount} failed`);
    }

    refetchTree();
    e.target.value = "";
    setTimeout(() => { setUploadStatus("idle"); setUploadMessage(""); }, 3000);
  };

  return (
    <div className="flex h-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.tsv,.txt,.json,.xml,.yaml,.yml,.md,.log,.sql,.html"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="w-72 flex-shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border flex items-center gap-2">
          <FolderTree className="w-3.5 h-3.5" />
          Explorer
        </div>

        {uploadStatus !== "idle" && (
          <div className={cn(
            "mx-2 mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2",
            uploadStatus === "uploading" && "bg-primary/10 text-primary",
            uploadStatus === "success" && "bg-green-500/10 text-green-700",
            uploadStatus === "error" && "bg-red-500/10 text-red-700",
          )}>
            {uploadStatus === "uploading" && <Upload className="w-3 h-3 animate-pulse" />}
            {uploadStatus === "success" && <Check className="w-3 h-3" />}
            {uploadStatus === "error" && <X className="w-3 h-3" />}
            <span>{uploadStatus === "uploading" ? "Uploading..." : uploadMessage}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 py-3">
          {fileTree ? (
            <TreeItem node={fileTree as TreeNode} depth={0} selectedPath={selectedPath} onSelect={setSelectedPath} onUploadToDir={handleUploadToDir} />
          ) : (
            <div className="text-sm text-muted-foreground p-4">Loading file tree...</div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Hover over a folder and click <Plus className="w-3 h-3 inline" /> to upload files into it.
            Supports CSV, JSON, TXT, XML, YAML, and MD files.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-background flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Loading...</p>
          </div>
        ) : fileContent ? (
          <>
            <div className="flex bg-card border-b border-border">
              <div className="px-4 py-2.5 border-b-2 border-primary text-sm text-foreground flex items-center gap-2 font-medium">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                {fileContent.path.split('/').pop()}
              </div>
              <div className="px-3 py-2.5 text-xs text-muted-foreground flex items-center">
                {fileContent.path}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <SyntaxHighlighter
                language={fileContent.language}
                style={oneLight}
                customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '13px' }}
                showLineNumbers
              >
                {fileContent.content}
              </SyntaxHighlighter>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileCode className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Select a file to view its source</p>
              <p className="text-xs mt-2 text-muted-foreground/60">Hover a folder and click + to upload files</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
