import { Schema, model, type Document, Types } from "mongoose";

export interface ISubmissionAnswer {
  fieldName: string;
  value: string | number | boolean | null;
}

export interface ISubmissionImage {
  fieldName: string;
  url: string;
}

export interface ISubmission extends Document {
  formId: Types.ObjectId;
  ownerId: Types.ObjectId;
  answers: ISubmissionAnswer[];
  images: ISubmissionImage[];
  createdAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: [
      {
        fieldName: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: false },
      },
    ],
    images: [
      {
        fieldName: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SubmissionModel = model<ISubmission>("Submission", submissionSchema);
