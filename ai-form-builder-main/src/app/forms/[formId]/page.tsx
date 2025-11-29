"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "image";

interface FormFieldSchema {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

interface FormSchema {
  title: string;
  description?: string;
  fields: FormFieldSchema[];
}

interface BackendFormResponse {
  id: string;
  schema: FormSchema;
}

type PageProps = {
  params: {
    formId: string;
  };
};

const FormPage = ({ params }: PageProps) => {
  const { formId } = params;

  const [form, setForm] = useState<BackendFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const UPLOAD_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  useEffect(() => {
    let cancelled = false;

    apiRequest<BackendFormResponse>(`/forms/${formId}`)
      .then((data) => {
        if (!cancelled) {
          setForm(data);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Failed to load form");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formId]);

  async function uploadImageToCloudinary(file: File): Promise<string> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        "Image upload is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );
    if (!res.ok) {
      throw new Error("Failed to upload image");
    }
    const json = await res.json();
    return json.secure_url as string;
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!form) return;

    setSubmitting(true);
    setSubmitted(false);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const answers: Record<string, string | number | boolean | null> = {};
    const images: Record<string, string> = {};

    for (const field of form.schema.fields) {
      const key = field.name;
      if (field.type === "checkbox") {
        const values = formData.getAll(key).map((v) => String(v));
        answers[key] = values.join(",");
      } else if (field.type === "switch") {
        const value = formData.get(key);
        answers[key] = value === "on" ? true : false;
      } else if (field.type === "image") {
        const file = formData.get(key);
        if (file && file instanceof File && file.size > 0) {
          const url = await uploadImageToCloudinary(file);
          images[key] = url;
        }
        answers[key] = null;
      } else {
        const value = formData.get(key);
        answers[key] = value != null ? String(value) : null;
      }
    }

    try {
      await apiRequest(`/forms/${form.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers, images }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormFieldSchema) => {
    const commonLabel = (
      <div className="mb-1">
        <Label htmlFor={field.name}>{field.label}</Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">
            {field.description}
          </p>
        )}
      </div>
    );

    switch (field.type) {
      case "text":
      case "email":
      case "number":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <Input
              id={field.name}
              name={field.name}
              type={field.type === "text" ? "text" : field.type}
              placeholder={field.placeholder}
            />
          </div>
        );
      case "textarea":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <Textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
            />
          </div>
        );
      case "select":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <Select
              name={field.name}
              onValueChange={(value) => {
                const input = document.querySelector<HTMLInputElement>(
                  `input[data-select-hidden='${field.name}']`
                );
                if (input) {
                  input.value = value;
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name={field.name}
              data-select-hidden={field.name}
            />
          </div>
        );
      case "radio":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <RadioGroup name={field.name}>
              {field.options?.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${field.name}-${option.value}`}
                  />
                  <Label htmlFor={`${field.name}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case "checkbox":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <div className="space-y-1">
              {field.options?.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <input
                    id={`${field.name}-${option.value}`}
                    type="checkbox"
                    name={field.name}
                    value={option.value}
                  />
                  <Label htmlFor={`${field.name}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      case "switch":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <div className="flex items-center space-x-2">
              <Switch
                id={field.name}
                name={field.name}
              />
            </div>
          </div>
        );
      case "image":
        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}
            <Input
              id={field.name}
              name={field.name}
              type="file"
              accept="image/*"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading form...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!form) {
    return <div>Form not found</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">
        {form.schema.title}
      </h1>
      {form.schema.description && (
        <p className="text-muted-foreground mb-6">
          {form.schema.description}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.schema.fields.map((field) => renderField(field))}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
        {submitted && (
          <p className="text-sm text-green-600 mt-2">
            Thank you! Your response has been recorded.
          </p>
        )}
      </form>
    </div>
  );
};

export default FormPage;
