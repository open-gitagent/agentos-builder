import { useState, useRef, useCallback } from "react";

export type MessageRole = "user" | "agent";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

export interface ChatEvent {
  type: "skill_loading" | "tool_use" | "tool_result" | "file_search" | "file_fetch" | "file_write" | "content" | "memory_update" | "system_read";
  data: string;
  timestamp: number;
  meta?: Record<string, any>;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeEvents, setActiveEvents] = useState<ChatEvent[]>([]);
  const [activeFiles, setActiveFiles] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessageId = Math.random().toString(36).substring(7);
    const agentMessageId = Math.random().toString(36).substring(7);

    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMessageId, role: "user", content },
    ];
    setMessages(newMessages);
    setIsStreaming(true);
    setActiveEvents([]);
    setActiveFiles([]);

    setMessages((prev) => [
      ...prev,
      { id: agentMessageId, role: "agent", content: "" },
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role === "agent" ? "assistant" : "user",
            content: m.content
          })),
          sessionId: sessionIdRef.current
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6);
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            if (eventType === "delta") {
              const chunk = data.text || "";
              setMessages(prev => prev.map(msg =>
                msg.id === agentMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ));
            } else if (eventType === "done") {
              // stream finished
            } else if (eventType === "error") {
              const errorMsg = data.error || "An error occurred while processing your request.";
              setMessages(prev => prev.map(msg =>
                msg.id === agentMessageId
                  ? { ...msg, content: msg.content || errorMsg }
                  : msg
              ));
            } else if (
              eventType === "system_read" ||
              eventType === "skill_loading" ||
              eventType === "file_fetch" ||
              eventType === "file_search" ||
              eventType === "file_write" ||
              eventType === "tool_use" ||
              eventType === "tool_result" ||
              eventType === "memory_update"
            ) {
              let eventData: string;
              if (eventType === "tool_result") {
                eventData = data.tool || data.status || data.skill || "result";
              } else {
                eventData = data.action || data.file || data.skill || data.tool || eventType;
              }
              const event: ChatEvent = {
                type: eventType as ChatEvent["type"],
                data: eventData,
                timestamp: Date.now(),
                meta: data,
              };
              setActiveEvents(prev => [...prev, event]);

              if (eventType === "file_fetch" || eventType === "file_search" || eventType === "file_write" || eventType === "tool_use") {
                const fileName = data.file || "";
                if (fileName) {
                  setActiveFiles(prev => {
                    if (!prev.includes(fileName)) return [...prev, fileName];
                    return prev;
                  });
                }
              }
            }
          } catch (e) {
            // skip unparseable
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Stream aborted");
      } else {
        console.error("Chat stream error:", error);
        setMessages(prev => prev.map(msg =>
          msg.id === agentMessageId && !msg.content
            ? { ...msg, content: "Sorry, I encountered an error connecting to the agent engine." }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { messages, isStreaming, activeEvents, activeFiles, sendMessage, stopStream };
}
