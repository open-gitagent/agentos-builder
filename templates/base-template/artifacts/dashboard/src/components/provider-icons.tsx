import { cn } from "@/lib/utils";

export type ModelProvider = "anthropic" | "openai" | "gemini" | "perplexity";

const providerLogoUrls: Record<ModelProvider, string> = {
  anthropic: "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/1/anthropic-icon-wii9u8ifrjrd99btrqfgi.png/anthropic-icon-tdvkiqisswbrmtkiygb0ia.png?_a=DATAiZAAZAA0",
  openai: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/openai.svg",
  gemini: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-gemini.svg",
  perplexity: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/perplexity-ai.svg",
};

const providerAlt: Record<ModelProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export function ProviderIcon({ provider, className }: { provider: ModelProvider; className?: string }) {
  return (
    <img
      src={providerLogoUrls[provider]}
      alt={providerAlt[provider]}
      className={cn("w-4 h-4 object-contain", className)}
    />
  );
}

export interface SkillModelInfo {
  provider: ModelProvider;
  model: string;
}

export const skillModels: Record<string, SkillModelInfo> = {
  "example-skill": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "data-validation": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "record-matching": { provider: "anthropic", model: "Claude Opus 4.6" },
  "anomaly-detection": { provider: "openai", model: "GPT-5.1" },
  "report-generation": { provider: "anthropic", model: "Claude Opus 4.6" },
  "policy-check": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "summarization": { provider: "gemini", model: "Gemini 2.5 Pro" },
  "classification": { provider: "openai", model: "GPT-5.1" },
  "entity-extraction": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "data-enrichment": { provider: "gemini", model: "Gemini 2.5 Pro" },
  "trend-analysis": { provider: "anthropic", model: "Claude Opus 4.6" },
  "deduplication": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "research": { provider: "perplexity", model: "Perplexity Sonar" },
  "quality-scoring": { provider: "openai", model: "GPT-5.1" },
  "translation": { provider: "gemini", model: "Gemini 2.5 Pro" },
  "redaction": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "routing": { provider: "gemini", model: "Gemini 2.5 Pro" },
  "lookup": { provider: "perplexity", model: "Perplexity Sonar" },
  "cross-check": { provider: "anthropic", model: "Claude Sonnet 4.6" },
  "notification": { provider: "gemini", model: "Gemini 2.5 Pro" },
  "risk-scoring": { provider: "openai", model: "GPT-5.1" },
};

export const sidebarSkillProviders: Record<string, ModelProvider> = {
  "example-skill": "anthropic",
  "data-validation": "anthropic",
  "record-matching": "anthropic",
  "anomaly-detection": "openai",
  "report-generation": "anthropic",
  "classification": "openai",
  "summarization": "gemini",
  "trend-analysis": "anthropic",
};
