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
}

interface FormChartData {
  id: string;
  title: string;
  submissions: number;
}

const ChartsPage = () => {
  const [data, setData] = useState<FormChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const forms = await apiRequest<BackendForm[]>("/forms");
        if (cancelled) return;

        const rows: FormChartData[] = [];

        for (const f of forms) {
          const subs = await apiRequest<BackendSubmission[]>(
            `/forms/${f._id}/submissions`
          );
          if (cancelled) return;

          rows.push({
            id: f._id,
            title: f.formSchema?.title || "Untitled form",
            submissions: subs.length,
          });
        }

        setData(rows);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load chart data");
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

  if (loading) return <div className="px-4">Loading charts...</div>;
  if (error) return <div className="px-4 text-red-500">{error}</div>;

  const max = data.reduce((m, d) => Math.max(m, d.submissions), 0) || 1;

  return (
    <div className="px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submissions per Form (Bar Chart)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            data.map((d) => {
              const widthPercent = (d.submissions / max) * 100;
              return (
                <div key={d.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate mr-2">{d.title}</span>
                    <span>{d.submissions}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded">
                    <div
                      className="h-2 bg-primary rounded"
                      style={{ width: `${widthPercent || 2}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsPage;
