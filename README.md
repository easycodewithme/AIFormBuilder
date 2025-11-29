# AI Form Builder with Context-Aware Memory

Full-stack AI-powered dynamic form generator built for the **CENTRALIGN AI Assessment**.

- **Frontend:** Next.js (App Router, TypeScript)
- **Backend:** Express + TypeScript
- **DB:** MongoDB Atlas
- **AI:** Google Gemini (chat + embeddings)
- **Media:** Cloudinary (image uploads)
- **Auth:** Email/password with JWT (HTTP-only cookie)
- **Semantic Memory:** Embeddings + top-K retrieval (Mongo, optional Pinecone)

---

## 1. Project Structure

```text
ai-form-builder-main/
├─ backend/                 # Express + Mongo + Gemini + Pinecone
│  ├─ src/
│  │  ├─ config/            # env + Mongo connection
│  │  ├─ models/            # User, Form, Submission
│  │  ├─ middleware/        # requireAuth (JWT)
│  │  ├─ routes/            # /auth, /forms
│  │  ├─ services/          # ai.service, memory.service
│  │  └─ server.ts
├─ ai-form-builder-main/    # Next.js app (frontend)
│  └─ src/
│     ├─ app/
│     │  ├─ auth/           # signup / login
│     │  ├─ (admin)/        # dashboard: forms, results, settings
│     │  ├─ form-generator/ # AI form generator dialog
│     │  └─ forms/[formId]/ # public form rendering & submission
│     ├─ components/        # UI: header, theme, inputs
│     └─ lib/api.ts         # helper to call backend
└─ .env                     # root env shared with backend
```

Backend runs on `http://localhost:4000`, frontend on `http://localhost:3000` in dev.

---

## 2. Environment Setup

### 2.1. Root `.env` (backend)

Create `./.env` in the **root** (same folder as `backend/` and `ai-form-builder-main/`):

```env
# MongoDB (Atlas)
MONGODB_URI=your-mongodb-uri
MONGODB_DB_NAME=centralign_forms

# Auth
JWT_SECRET=your-long-random-secret
BCRYPT_SALT_ROUNDS=10

# AI (Gemini)
GEMINI_API_KEY=your-gemini-key
LLM_MODEL=gemini-1.5-pro
EMBEDDING_MODEL=text-embedding-004

# Cloudinary (backend-side, used for future server uploads if needed)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset

# Semantic retrieval
RETRIEVAL_TOP_K=5
RETRIEVAL_MIN_SCORE=0.3

# Optional: Pinecone (bonus semantic index)
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=

# Backend
PORT=4000
FRONTEND_URL=http://localhost:3000
```

> For Pinecone, if you enable it, make sure your index `dimension` matches the embedding size (Gemini `text-embedding-004` → 768).

### 2.2. Frontend `.env.local` (Next.js)

Create `ai-form-builder-main/.env.local`:

```env
# Backend URL (Express)
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Cloudinary (public, for browser uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

> The frontend uploads images **directly to Cloudinary** using these `NEXT_PUBLIC_*` vars and stores only URLs in Mongo via the backend.

---

## 3. Local Development

From the project root:

### 3.1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../ai-form-builder-main
npm install
```

### 3.2. Run backend

```bash
cd backend
npm run dev    # http://localhost:4000
```

### 3.3. Run frontend

```bash
cd ai-form-builder-main
npm run dev    # http://localhost:3000
```

Open `http://localhost:3000` in your browser.

---

## 4. Core Features (Assignment Mapping)

### 4.1. Authentication & Dashboard

- **Email/password auth** via Express `/auth/signup`, `/auth/login`.
- Frontend login/signup pages under `/auth/login` and `/auth/signup`.
- Auth state stored in **HTTP-only JWT cookie**.
- Dashboard layout under `(admin)` with:
  - **My Forms**: `/view-forms` (lists all forms belonging to logged-in user).
  - **Results**: `/results` (submissions per form, including images).
  - **Settings**: `/settings` (current user info + feature toggles placeholders).
- Header shows logged-in email + logout button.

### 4.2. AI Form Generation

- **Prompt → JSON schema** using Google Gemini chat model.
- Endpoint: `POST /forms/generate` (protected by auth).
- Backend logic:
  - Computes **semantic context** from past forms (see §5).
  - Calls `generateFormSchema(prompt, historySummaries)` in `ai.service.ts`.
  - Returns + persists:
    - `formSchema` (full JSON schema)
    - `summary` (compact metadata)
    - `embedding` (vector for semantic retrieval)
- Frontend form generator:
  - `src/app/form-generator/index.tsx` opens a dialog where user types a natural-language prompt.
  - Performs `apiRequest("/forms/generate", { method: "POST", body: { prompt } })`.
  - Navigates to `/forms/[id]` on success.

### 4.3. Dynamic Public Form Rendering

- Public URL: `/forms/[formId]`.
- On load:
  - Calls backend `GET /forms/:id` → `{ id, schema }`.
  - Renders fields from `schema.fields` supporting:
    - `text`, `textarea`, `number`, `email`
    - `select`, `radio`, `checkbox`, `switch`
    - `image` (file input)
- Submission:
  - Builds `answers` record from all non-image fields.
  - For `image` fields:
    - Uploads file to Cloudinary via unsigned preset.
    - Receives `secure_url`.
    - Sends **only the URL** in `images` map to backend.
  - Calls `POST /forms/:id/submit` with body `{ answers, images }`.

### 4.4. Submissions & Dashboard Results

- Backend `POST /forms/:id/submit`:
  - Validates via Zod.
  - Looks up the form.
  - Persists to `SubmissionModel` with shape:
    - `answers: [{ fieldName, value }]`
    - `images: [{ fieldName, url }]`
- Backend `GET /forms/:id/submissions` (auth required):
  - Verifies form belongs to current user via `ownerId`.
  - Returns all submissions sorted by `createdAt`.
- Frontend `/results` dashboard:
  - Dropdown of user forms (from `GET /forms`).
  - For selected form:
    - Fetches full schema (`GET /forms/:id`) and submissions.
    - Builds table columns from `schema.fields`.
    - Builds rows from `answers` and `images`.
  - **Image columns render thumbnails** for fields of type `"image"` using URLs from `Submission.images`.

### 4.5. Image Upload Handling

- **Public form submission:**
  - Images uploaded from browser → Cloudinary.
  - Backend stores only the **returned image URLs**.
- **Generator UI example images:**
  - API supports `exampleImages` in `POST /forms/generate` input, but the current frontend dialog does not yet expose a file/image picker here.
  - This is noted as a limitation / future improvement.

---

## 5. Context Memory Layer & Semantic Retrieval

### 5.1. What is stored per form

In `FormModel`:

- `formSchema`: full JSON schema (title, fields, etc.).
- `summary`: **compact metadata**:
  - `purpose` (original prompt)
  - `fieldNames` (array of field names)
  - `fieldTypes` (array of field types)
  - `hasImageUpload` (boolean)
- `embedding`: numeric vector generated from:

  ```ts
  embeddingText = `${schema.title}\n${schema.description}\n${fieldNames.join(", ")}`;
  ```

### 5.2. Prompt → embedding

`memory.service.ts`:

```ts
const embedding = await embedText(prompt);
```

- `embedText` uses Gemini `text-embedding-004` to turn text into a dense vector.

### 5.3. Finding only relevant past forms (top‑K)

`getRelevantForms(ownerId, prompt)`:

1. Compute `embedding = embedText(prompt)`.
2. Try Pinecone (if configured):

   ```ts
   index.query({ vector: embedding, topK, filter: { ownerId }, includeMetadata: true })
   ```

3. Fallback to **Mongo cosine similarity**:

   ```ts
   const forms = await FormModel.find({ ownerId }).lean();
   const scored = forms
     .filter(hasEmbedding)
     .map((f) => ({ form: f, score: cosineSimilarity(promptEmbedding, f.embedding) }))
     .filter((s) => s.score >= minScore)
     .sort((a, b) => b.score - a.score)
     .slice(0, topK);
   ```

Configurable via env:

```env
RETRIEVAL_TOP_K=5        # number of forms to consider
RETRIEVAL_MIN_SCORE=0.3  # similarity threshold
```

### 5.4. What goes into the LLM prompt

In `POST /forms/generate`:

```ts
const relevantForms = await getRelevantForms(ownerId, prompt);
const historySummaries = relevantForms.map((f) => f.summary);
```

In `ai.service.ts`:

```ts
const systemPrompt = `You are an intelligent form schema generator.
Here is relevant user form history for reference:
${JSON.stringify(historySummaries, null, 2)}

Now generate a new form schema for this request:
"${prompt}".

Return JSON ONLY in this exact structure: {...}`;
```

This matches the assignment requirement:

> Here is relevant user form history for reference:
> [
>   { "purpose": "Job form", "fields": ["name","email","resume","photo"], ... },
>   { "purpose": "Career form", "fields": ["portfolio","github"], ... }
> ]

Only the **small metadata slice** (`summary`) is sent, never full historical schemas, even if the user has created thousands of forms.

### 5.5. Scalability notes

- **Token efficiency:** Only `top‑K` summaries are included in the LLM prompt (e.g. 3–10 items), keeping tokens low and avoiding hitting context limits.
- **Thousands of forms:**
  - Retrieving a handful of forms from an embedding index scales well.
  - Mongo fallback is sufficient for moderate user counts; Pinecone can be enabled for very large scale.
- **Latency:**
  - Main costs are a single embedding call + single chat completion + DB / Pinecone query.
  - `top‑K` keeps prompt size & network time under control.

---

## 6. Example Prompts & Flows

### 6.1. Example prompts

- "I need a signup form with name, email, age, and profile picture."
- "Create a job application form with resume upload, LinkedIn, and GitHub link."
- "Customer feedback survey with rating (1–5), comments, and consent checkbox."

### 6.2. Typical user flow

1. **Sign up / Log in**
   - Visit `/auth/signup` or `/auth/login`.
2. **Create a new form**
   - From Dashboard, click **Create Form**.
   - Enter a natural language prompt.
   - Wait for AI to generate schema → browser navigates to `/forms/[id]`.
3. **Share / use public form**
   - Copy the `/forms/[id]` URL and share with respondents.
4. **Submit responses**
   - Respondents fill text fields and upload images.
   - Images are uploaded to Cloudinary; URLs are stored.
5. **View results**
   - Owner visits `/results`.
   - Picks a form in the dropdown.
   - Sees a table of submissions, including image thumbnails.

---

## 7. Deployment (Vercel + External Backend)

### 7.1. Deploy backend (Express)

Vercel is best for the Next.js frontend. For the **Express backend**, use any Node host (Render, Railway, Fly.io, Heroku, etc.). High-level steps:

1. **Push repo to GitHub.**
2. On your backend host:
   - Create a new Node app from `backend/` subfolder.
   - Set environment variables from `./.env`.
   - Install dependencies and set start command:

     ```bash
     npm install
     npm run build    # if you add a build step, else skip
     npm start        # or ts-node-dev/pm2 in dev
     ```

3. Note the deployed backend URL, e.g. `https://your-backend-host.com`.

### 7.2. Deploy frontend to Vercel

1. In Vercel dashboard, **Import Project** from GitHub.
2. In project settings:
   - Set **Root Directory** to `ai-form-builder-main`.
   - Framework preset: **Next.js**.
3. Configure environment variables (for the Vercel project):

   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-backend-host.com
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
   ```

4. Deploy. Vercel will build and host the Next.js app.
5. Open the Vercel URL (e.g. `https://your-frontend.vercel.app`) and:
   - Sign up/login.
   - Create forms (these will call your external backend).

> IMPORTANT: Ensure CORS and `FRONTEND_URL` in backend `.env` are set to the Vercel URL in production.

---

## 8. Validation, Caching & Bonus Features

### 8.1. Validation (partial)

- Backend uses **Zod** to validate:
  - `POST /forms/generate` input (`prompt` string, optional `exampleImages`).
  - `POST /forms/:id/submit` input (`answers` and `images` object shapes).
- Client-side form validation is basic (required prompt, required public form fields via HTML `required` where appropriate).
- Future work:
  - Enforce field-level validation from schema (`min`, `max`, regex, email format) both client- and server-side.

### 8.2. Caching & debouncing (not implemented)

- Current implementation computes embeddings and performs retrieval per request.
- Could be improved by:
  - Caching recent prompt → retrieval results.
  - Debouncing multiple rapid `generate` calls for the same user/prompt.

### 8.3. Pinecone semantic index (optional bonus)

- `memory.service.ts` uses Pinecone when `PINECONE_*` env vars are set.
- If Pinecone is misconfigured (e.g., wrong vector dimension), the code catches errors and falls back to Mongo-only similarity.
- To fully enable Pinecone:
  - Create index with `dimension=768` (for `text-embedding-004`).
  - Set `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME` in `.env`.

---

## 9. Limitations & Future Improvements

- **Generator UI image hints:** Backend supports `exampleImages`, but the frontend form generator UI does not yet allow attaching example images to guide the AI.
- **Advanced validation:** Field-level constraints (`min`, `max`, regex, email, file type/size) are not fully enforced.
- **No rate limiting / quotas:** A real deployment should limit AI calls per user and add proper logging/monitoring.
- **Single-tenant assumptions:** Retrieval filters only by `ownerId`; multi-tenant / org-level separation is not implemented.
- **Tests:** No automated test suite is included; manual verification is required.

These are reasonable next steps if evolving this into a production-grade system.

---

## 10. Checklist vs Assignment

- **Auth & Dashboard**
  - [x] Email/password signup & login.
  - [x] Dashboard with forms list.
  - [x] Submissions grouped by form, with loading/empty states.

- **AI Form Generator**
  - [x] Prompt → JSON schema via Gemini.
  - [x] Schemas persisted to MongoDB.
  - [x] Summaries + embeddings stored for memory.

- **Context-Aware Memory Retrieval**
  - [x] Summaries stored per form.
  - [x] Prompt → embedding → top‑K relevant forms.
  - [x] Only compact summaries sent in prompt context.

- **Public Form Rendering**
  - [x] `/forms/[id]` renders dynamic form from schema.
  - [x] Submissions including images.
  - [x] Responses + image URLs saved in DB.

- **Image Upload Handling**
  - [x] Public form image uploads via Cloudinary; URLs stored.
  - [ ] Generator UI image attachments (API-ready but UI missing).

- **Scalability / Memory**
  - [x] Top‑K retrieval implemented with configurable `RETRIEVAL_TOP_K`.
  - [x] Designed to work with thousands of past forms using embeddings.
  - [x] Optional Pinecone integration for scalable vector search.

- **Bonus**
  - [~] Validation: basic Zod + minimal client checks (field-level validation still to do).
  - [ ] Caching / debouncing semantic search results.
  - [x] Semantic memory layer structured for Pinecone.

This README, plus the implemented code, should be sufficient to deploy the Next.js frontend on Vercel, the Express backend on a Node host, and demonstrate all required core features for the CENTRALIGN AI assessment.
