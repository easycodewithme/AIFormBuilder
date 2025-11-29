import { Schema, model, type Document, Types } from "mongoose";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "image";

export interface IFormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface IFormFieldOption {
  label: string;
  value: string;
}

export interface IFormFieldSchema {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: IFormFieldOption[];
  validation?: IFormFieldValidation;
  description?: string;
}

export interface IFormSchema {
  title: string;
  description?: string;
  fields: IFormFieldSchema[];
}

export interface IForm extends Document {
  ownerId: Types.ObjectId;
  purpose: string;
  formSchema: IFormSchema;
  summary: {
    purpose: string;
    fieldNames: string[];
    fieldTypes: FieldType[];
    hasImageUpload: boolean;
  };
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const formSchema = new Schema<IForm>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purpose: { type: String, required: true },
    formSchema: {
      title: { type: String, required: true },
      description: { type: String },
      fields: [
        {
          name: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, required: true },
          placeholder: { type: String },
          options: [
            {
              label: { type: String, required: true },
              value: { type: String, required: true },
            },
          ],
          validation: {
            required: { type: Boolean },
            min: { type: Number },
            max: { type: Number },
            pattern: { type: String },
          },
          description: { type: String },
        },
      ],
    },
    summary: {
      purpose: { type: String, required: true },
      fieldNames: [{ type: String, required: true }],
      fieldTypes: [{ type: String, required: true }],
      hasImageUpload: { type: Boolean, required: true },
    },
    embedding: [{ type: Number }],
  },
  { timestamps: true }
);

export const FormModel = model<IForm>("Form", formSchema);
