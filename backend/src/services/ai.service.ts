import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env";
import type { IFormSchema, FieldType } from "../models/form.model";
import { config as globalConfig } from "../config/env";
import { Pinecone } from "@pinecone-database/pinecone";

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: config.embeddingModel });
  const result = await (model as any).embedContent({ content: { parts: [{ text }] } });
  const embedding = result?.embedding?.values as number[] | undefined;
  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }
  return embedding;
}

export async function generateFormSchema(
  prompt: string,
  historySummaries: Array<{ purpose: string; fieldNames: string[]; fieldTypes: FieldType[]; hasImageUpload: boolean }>
): Promise<IFormSchema> {
  const model = genAI.getGenerativeModel({ model: config.llmModel });

  const systemPrompt = `You are an intelligent form schema generator.
Here is relevant user form history for reference:
${JSON.stringify(historySummaries, null, 2)}

Now generate a new form schema for this request:
"${prompt}".

Return JSON ONLY in this exact structure:
{
  "title": string,
  "description": string,
  "fields": [
    {
      "name": string,
      "label": string,
      "type": "text"|"textarea"|"number"|"email"|"select"|"radio"|"checkbox"|"switch"|"image",
      "placeholder"?: string,
      "options"?: [{"label": string, "value": string}],
      "validation"?: {"required"?: boolean, "min"?: number, "max"?: number, "pattern"?: string},
      "description"?: string
    }
  ]
}`;

  const result = await model.generateContent(systemPrompt);
  const response = await result.response;
  const text = response.text();
  const jsonString = text.replace(/^```json\s*([\s\S]*)\s*```$/g, "$1");
  const parsed = JSON.parse(jsonString) as IFormSchema;
  return parsed;
}

export function getPineconeClient() {
  if (!globalConfig.pinecone.apiKey || !globalConfig.pinecone.indexName) {
    return null;
  }
  return new Pinecone({ apiKey: globalConfig.pinecone.apiKey });
}
