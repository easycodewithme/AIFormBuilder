"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface BackendForm {
  _id: string;
  formSchema?: {
    title?: string;
  };
}

interface BackendSubmission {
  _id: string;
  createdAt: string;
}

interface FormStats {
  id: string;
  title: string;
  submissions: number;
}

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalForms, setTotalForms] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [perForm, setPerForm] = useState<FormStats[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const forms = await apiRequest<BackendForm[]>("/forms");
        if (cancelled) return;

        setTotalForms(forms.length);

        const stats: FormStats[] = [];
        let submissionsCount = 0;

        for (const f of forms) {
          const subs = await apiRequest<BackendSubmission[]>(
            `/forms/${f._id}/submissions`
          );
          if (cancelled) return;

          const count = subs.length;
          submissionsCount += count;
          stats.push({
            id: f._id,
            title: f.formSchema?.title || "Untitled form",
            submissions: count,
          });
        }

        setTotalSubmissions(submissionsCount);
        setPerForm(stats);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="px-4">Loading analytics...</div>;
  if (error) return <div className="px-4 text-red-500">{error}</div>;

  const avgPerForm = totalForms > 0 ? (totalSubmissions / totalForms).toFixed(1) : "0";

  return (
    <div className="px-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Forms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalForms}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Submissions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalSubmissions}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Submissions / Form</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {avgPerForm}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions by Form</CardTitle>
        </CardHeader>
        <CardContent>
          {perForm.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {perForm.map((f) => (
                <li key={f.id} className="flex justify-between">
                  <span className="truncate mr-4">{f.title}</span>
                  <span className="font-medium">{f.submissions}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
