import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware";
import { FormModel, type FieldType } from "../models/form.model";
import { SubmissionModel } from "../models/submission.model";
import { getRelevantForms } from "../services/memory.service";
import { embedText, generateFormSchema, getPineconeClient } from "../services/ai.service";
import { config } from "../config/env";

const router = Router();

const generateSchema = z.object({
  prompt: z.string().min(5),
  exampleImages: z.array(z.string().url()).optional(),
});

router.post("/generate", requireAuth, async (req: AuthRequest, res: Response) => {
  const parseResult = generateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { prompt } = parseResult.data;
  const ownerId = req.userId as string;

  try {
    const relevantForms = await getRelevantForms(ownerId, prompt);
    const historySummaries = relevantForms.map((f) => f.summary);

    const schema = await generateFormSchema(prompt, historySummaries);

    const fieldNames = schema.fields.map((f) => f.name);
    const fieldTypes = schema.fields.map((f) => f.type as FieldType);
    const hasImageUpload = fieldTypes.includes("image");

    const summary = {
      purpose: prompt,
      fieldNames,
      fieldTypes,
      hasImageUpload,
    };

    const embeddingText = `${schema.title}\n${schema.description || ""}\n${fieldNames.join(", ")}`;
    const embedding = await embedText(embeddingText);

    const form = await FormModel.create({
      ownerId,
      purpose: prompt,
      formSchema: schema,
      summary,
      embedding,
    });

    const pineconeClient = getPineconeClient();
    if (pineconeClient && config.pinecone.indexName) {
      try {
        const index = pineconeClient.index(config.pinecone.indexName);
        await index.upsert([
          {
            id: form._id.toString(),
            values: embedding,
            metadata: { ownerId },
          },
        ] as any);
      } catch (err) {
        console.error("Pinecone upsert failed, continuing without vector index", err);
      }
    }

    res.status(201).json({ id: form._id, schema: form.formSchema, summary: form.summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate form" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const ownerId = req.userId as string;
  const forms = await FormModel.find({ ownerId })
    .select("formSchema.title formSchema.description summary createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json(forms);
});

router.get("/:id/submissions", requireAuth, async (req: AuthRequest, res: Response) => {
  const ownerId = req.userId as string;
  const { id } = req.params;

  const form = await FormModel.findOne({ _id: id, ownerId }).lean();
  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  const submissions = await SubmissionModel.find({ formId: form._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(submissions);
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const form = await FormModel.findById(id).lean();
  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }
  res.json({ id: form._id, schema: (form as any).formSchema });
});

const submitSchema = z.object({
  answers: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  images: z.record(z.string().url()).optional(),
});

router.post("/:id/submit", async (req: Request, res: Response) => {
  const parseResult = submitSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid submission" });
  }

  const { id } = req.params;
  const { answers, images } = parseResult.data;

  const form = await FormModel.findById(id).lean();
  if (!form) {
    return res.status(404).json({ message: "Form not found" });
  }

  const answersArray = Object.entries(answers).map(([fieldName, value]) => ({
    fieldName,
    value,
  }));

  const imagesArray = images
    ? Object.entries(images).map(([fieldName, url]) => ({ fieldName, url }))
    : [];

  await SubmissionModel.create({
    formId: form._id,
    ownerId: form.ownerId,
    answers: answersArray,
    images: imagesArray,
  });

  res.status(201).json({ message: "Submission saved" });
});

export const formRouter = router;
