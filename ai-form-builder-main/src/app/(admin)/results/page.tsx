"use client";

import React, { useEffect, useState } from "react";
import { NextUIProvider } from "@nextui-org/react";
import Res, { ResultColumn, ResultRow } from "./Res";
import FormsPicker from "./FormPicker";
import { apiRequest } from "@/lib/api";

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

interface BackendForm {
  _id: string;
  formSchema?: {
    title?: string;
    description?: string;
  };
}

interface BackendFormDetail {
  id: string;
  schema: {
    title: string;
    description?: string;
    fields: { name: string; label: string; type: FieldType }[];
  };
}

interface BackendSubmissionAnswer {
  fieldName: string;
  value: string | number | boolean | null;
}

interface BackendSubmissionImage {
  fieldName: string;
  url: string;
}

interface BackendSubmission {
  _id: string;
  answers: BackendSubmissionAnswer[];
  images?: BackendSubmissionImage[];
  createdAt: string;
}

const Page = () => {
  const [forms, setForms] = useState<BackendForm[]>([]);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [columns, setColumns] = useState<ResultColumn[] | null>(null);
  const [rows, setRows] = useState<ResultRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<BackendForm[]>("/forms")
      .then((data) => {
        if (cancelled) return;
        setForms(data);
        const opts = data.map((f) => ({
          label: f.formSchema?.title || "Untitled form",
          value: f._id,
        }));
        setOptions(opts);
        if (!selectedFormId && opts.length > 0) {
          setSelectedFormId(opts[0].value);
        }
      })
      .catch((err) => {
        console.error("Failed to load forms for results dashboard", err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFormId]);

  useEffect(() => {
    const loadSubmissions = async (formId: string) => {
      try {
        // Get full schema (including fields) for this form
        const detail = await apiRequest<BackendFormDetail>(`/forms/${formId}`);
        const fields = detail.schema.fields || [];

        if (!detail || fields.length === 0) {
          setColumns(null);
          setRows(null);
          return;
        }

        const submissions = await apiRequest<BackendSubmission[]>(
          `/forms/${formId}/submissions`
        );

        const cols: ResultColumn[] = fields.map((f) => ({
          key: f.name,
          label: f.label,
          type: f.type,
        }));

        const mappedRows: ResultRow[] = submissions.map((sub) => {
          const values = cols.map((col) => {
            // Prefer answer value if present
            const answer = sub.answers.find((a) => a.fieldName === col.key);
            if (answer && answer.value != null) {
              return answer.value;
            }

            // For image fields, fall back to image URL
            if (col.type === "image" && sub.images) {
              const image = sub.images.find((img) => img.fieldName === col.key);
              if (image) return image.url;
            }

            return "";
          });
          return { values };
        });

        setColumns(cols);
        setRows(mappedRows);
      } catch (err) {
        console.error("Failed to load submissions", err);
        setColumns(null);
        setRows(null);
      }
    };

    if (selectedFormId) {
      loadSubmissions(selectedFormId);
    }
  }, [selectedFormId]);

  const handleFormChange = (formId: string) => {
    setSelectedFormId(formId);
  };

  return (
    <NextUIProvider>
      {options.length > 0 && (
        <FormsPicker options={options} onChange={handleFormChange} />
      )}
      <Res columns={columns} rows={rows} />
    </NextUIProvider>
  );
};

export default Page;
