import type { IForm } from "../models/form.model";
import { FormModel } from "../models/form.model";
import { config } from "../config/env";
import { embedText, getPineconeClient } from "./ai.service";

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

export async function getRelevantFormsFromMongo(
  ownerId: string,
  promptEmbedding: number[]
): Promise<IForm[]> {
  const forms = (await FormModel.find({ ownerId }).lean()) as unknown as IForm[];
  const scored = forms
    .filter((f) => Array.isArray(f.embedding) && f.embedding.length === promptEmbedding.length)
    .map((f) => ({
      form: f,
      score: cosineSimilarity(promptEmbedding, f.embedding as number[]),
    }))
    .filter((s) => s.score >= config.retrieval.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, config.retrieval.topK);

  return scored.map((s) => s.form);
}

export async function getRelevantForms(
  ownerId: string,
  prompt: string
): Promise<IForm[]> {
  const embedding = await embedText(prompt);

  const pineconeClient = getPineconeClient();
  if (pineconeClient && config.pinecone.indexName) {
    try {
      const index = pineconeClient.index(config.pinecone.indexName);
      const queryResult = await index.query({
        vector: embedding,
        topK: config.retrieval.topK,
        filter: { ownerId },
        includeMetadata: true,
      } as any);

      const ids = (queryResult.matches || []).map((m: any) => m.id);
      if (ids.length > 0) {
        const forms = (await FormModel.find({ _id: { $in: ids } }).lean()) as unknown as IForm[];
        return forms;
      }
    } catch (err) {
      console.error("Pinecone query failed, falling back to MongoDB memory", err);
    }
  }

  return getRelevantFormsFromMongo(ownerId, embedding);
}
