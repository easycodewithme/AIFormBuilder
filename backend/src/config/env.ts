import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: process.env.PORT || 4000,
  frontendUrl: process.env.FRONTEND_URL,
  mongoUri: process.env.MONGODB_URI || "",
  mongoDbName: process.env.MONGODB_DB_NAME || "centralign_forms",
  jwtSecret: process.env.JWT_SECRET || "",
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "gemini-1.5-flash",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-004",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
  },
  retrieval: {
    topK: parseInt(process.env.RETRIEVAL_TOP_K || "5", 10),
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE || "0.3"),
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || "",
    environment: process.env.PINECONE_ENVIRONMENT || "",
    indexName: process.env.PINECONE_INDEX_NAME || "",
  },
};
