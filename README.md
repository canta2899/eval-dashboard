# Eval

A small example of collecting and displaying evaluation traces from a langchain agent.

## Usage

- Run an OpenAI compatible API

- Create a .env file with the following content:

```
LLM_BASE_URL=api-base-url
LLM_API_KEY=api-key
LLM_MODEL=model-name
LLM_HEADERS='{"header-name": "header-value"}' # if needed
```

For example, to run it with a local model served by llama.cpp:

```
LLM_BASE_URL=http://localhost:8080/v1
LLM_API_KEY=dummy
LLM_MODEL=gpt-oss-20b
```

- Install dependencies and run the app:

```
bun install
bun run dev
```

- Navigate to `http://localhost:3000` to interact with the agent and view traces. Traces can also be saved to the `traces` directory for later analysis.

