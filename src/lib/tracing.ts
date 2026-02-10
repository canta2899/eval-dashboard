import { createMiddleware } from "langchain";
import { z } from "zod";

export type TraceStep = {
  type: "model" | "tool";
  name: string;
  chatId: string;
  input: any;
  output?: any;
  error?: string;
  latency: number;
};

const contextSchema = z.object({
  chatId: z.string(),
});

export const createTracingMiddleware = (onTrace: (t: TraceStep) => void) => {
  return createMiddleware({
    name: "TracingMiddleware",
    contextSchema,

    wrapModelCall: async (request, handler) => {
      const startTime = Date.now();
      const input = request.messages;
      const { chatId } = request.runtime.context;

      try {
        const result = await handler(request);

        onTrace({
          type: "model",
          name: (request.model as any)?.name ?? "llm",
          chatId,
          input,
          output: result,
          latency: Date.now() - startTime,
        });

        return result;
      } catch (e: any) {
        onTrace({
          type: "model",
          name: (request.model as any)?.name ?? "llm",
          chatId,
          input,
          error: e.message,
          latency: Date.now() - startTime,
        });
        throw e;
      }
    },

    wrapToolCall: async (request, handler) => {
      const startTime = Date.now();
      const { name, args } = request.toolCall;

      const { chatId } = request.runtime.context;

      try {
        const result = await handler(request);

        onTrace({
          type: "tool",
          name,
          chatId,
          input: args,
          output: result,
          latency: Date.now() - startTime,
        });

        return result;
      } catch (e: any) {
        onTrace({
          type: "tool",
          name,
          chatId,
          input: args,
          error: e.message,
          latency: Date.now() - startTime,
        });
        throw e;
      }
    },
  });
};
