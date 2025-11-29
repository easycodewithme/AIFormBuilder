"use client";

import React, { useEffect, useState } from "react";
import FormList from "@/app/forms/FormList";
import { apiRequest } from "@/lib/api";

interface BackendForm {
  _id: string;
  formSchema?: {
    title?: string;
    description?: string;
  };
}

interface DashboardForm {
  id: number;
  formID: string;
  name: string;
  description: string;
}

const Page = () => {
  const [forms, setForms] = useState<DashboardForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiRequest<BackendForm[]>("/forms")
      .then((data) => {
        if (cancelled) return;
        const mapped: DashboardForm[] = data.map((f, index) => ({
          id: index + 1,
          formID: f._id,
          name: f.formSchema?.title || "Untitled form",
          description: f.formSchema?.description || "",
        }));
        setForms(mapped);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message || "Failed to load forms");
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
  }, []);

  if (loading) {
    return <div>Loading forms...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-normal px-4 m-5">My Forms</h1>
      <FormList forms={forms as any} />
    </div>
  );
};

export default Page;
