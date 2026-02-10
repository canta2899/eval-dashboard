import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { createTracingMiddleware, type TraceStep } from "../src/lib/tracing";

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

const traces: Array<TraceStep> = [];

const tracingMiddleware = createTracingMiddleware((trace) => {
  traces.push(trace);
});

const llm = createAgent({
  model: new ChatOpenAI({
    configuration: {
      baseURL: "http://localhost:8080/v1",
    },
    model: "gpt-oss-20b",
    apiKey: "dummy",
  }),
  tools: [getWeather],
  middleware: [tracingMiddleware],
  systemPrompt:
    "You are a helpful assistant that provides weather information. Avoid calling the same tool twice in a row.",
});

async function main() {
  let response = await llm.invoke(
    {
      messages: [
        {
          role: "user",
          content: "What's the weather like in New York?",
        },
      ],
    },
    {
      context: { chatId: "123" },
    },
  );

  response = await llm.invoke(
    {
      messages: [
        ...response.messages,
        {
          role: "user",
          content: "What did I just ask you to do?",
        },
      ],
    },
    { context: { chatId: "123" } },
  );

  response = await llm.invoke(
    {
      messages: [
        ...response.messages,
        {
          role: "user",
          content: "What's the weather like in Paris?",
        },
      ],
    },
    { context: { chatId: "123" } },
  );

  Bun.write("trace.json", JSON.stringify(traces, null, 2));

  console.log("Traces saved to trace.json");
}

main();
