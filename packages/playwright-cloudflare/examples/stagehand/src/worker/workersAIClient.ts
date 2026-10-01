import {
  CreateChatCompletionOptions,
  LLMClient,
  LogLine,
} from "@browserbasehq/stagehand";
import zodToJsonSchema from 'zod-to-json-schema';

type WorkersAIOptions = AiOptions & {
  logger?: (line: LogLine) => void;
};

const modelId = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// Basic implementation of LLMClient for Workers AI.
// This uses @cf/meta/llama-3.3-70b-instruct-fp8-fast model. If you want to
// use a different model, you can adapt this class.
export class WorkersAIClient extends LLMClient {

  public type = "workers-ai" as const;
  private binding: Ai;
  private options?: WorkersAIOptions;

  constructor(binding: Ai, options?: WorkersAIOptions) {
    super(modelId);
    this.binding = binding;
    this.options = options;
  }
  
  async createChatCompletion<T>({ options }: CreateChatCompletionOptions): Promise<T> {
    const schema = options.response_model?.schema;
    this.options?.logger?.({ category: "workersai", message: "thinking..." });
    const { response } = await this.binding.run(this.modelName as keyof AiModels, {
      messages: options.messages,
      // @ts-ignore
      tools: options.tools,
      response_format: schema ? {
        type: "json_schema",
        json_schema: zodToJsonSchema(schema),
      } : undefined,
      temperature: 0,
    }, this.options) as AiTextGenerationOutput;
    this.options?.logger?.({ category: "workersai", message: "completed thinking!" });

    return {
      data: response,
    } as T;
  }
}
