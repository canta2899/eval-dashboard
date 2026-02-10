import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { createTracingMiddleware, type TraceStep } from "./tracing";

const getWeather = tool(
  ({ location }) =>
    `The weather in ${location} is sunny with a high of 25°C and a low of 15°C.`,
  {
    name: "get_weather",
    description: "Get weather for the given location",
    schema: z.object({
      location: z.string().describe("The location to get the weather for"),
    }),
  },
);

const TRACES = {} as Record<string, TraceStep[]>;

export function saveTrace(chatId: string, trace: TraceStep) {
  if (!TRACES[chatId]) {
    TRACES[chatId] = [];
  }
  TRACES[chatId].push(trace);
}

export function getTraces(chatId: string) {
  return TRACES[chatId] || [];
}

const tracingMiddleware = createTracingMiddleware((trace) => {
  saveTrace(trace.chatId, trace);
});

const getModel = () => {
  if (
    !process.env.LLM_BASE_URL ||
    !process.env.LLM_API_KEY ||
    !process.env.LLM_MODEL
  ) {
    throw new Error(
      "LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL environment variables are required",
    );
  }

  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const headers = process.env.LLM_HEADERS
    ? JSON.parse(process.env.LLM_HEADERS)
    : {};

  return new ChatOpenAI({
    configuration: {
      baseURL,
      defaultHeaders: headers,
    },
    model,
    apiKey,
  });
};

export const llm = createAgent({
  model: getModel(),
  tools: [getWeather],
  middleware: [tracingMiddleware],
  systemPrompt:
    "You are a helpful assistant that provides weather information. Avoid calling the same tool twice in a row.",
});
