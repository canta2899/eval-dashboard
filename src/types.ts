export interface Message {
  role: string;
  content: string;
}

export interface TraceStep {
  type: "model" | "tool";
  name: string;
  chatId: string;
  input: any;
  output?: any;
  error?: string;
  latency: number;
}

export const TYPES_LOADED = true;
