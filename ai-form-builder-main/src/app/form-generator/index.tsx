"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Props = {};

const FormGenerator = (props: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const UPLOAD_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

  const onFormCreate = () => {
    setOpen(true);
  };

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formEl = event.currentTarget;
      const fileInput = formEl.elements.namedItem(
        "exampleImages"
      ) as HTMLInputElement | null;

      let exampleImages: string[] = [];

      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const files = Array.from(fileInput.files).filter(
          (f) => f instanceof File && f.size > 0
        );

        if (files.length > 0) {
          exampleImages = await Promise.all(
            files.map((file) => uploadImageToCloudinary(file))
          );
        }
      }

      const data = await apiRequest<{ id: string }>("/forms/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, exampleImages }),
      });

      setOpen(false);
      router.push(`/forms/${data.id}`);
    } catch (err: any) {
      const message = err?.message || "Failed to generate form";
      if (message.toLowerCase().includes("unauthorized")) {
        router.push("/auth/login");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={onFormCreate}>Create Form</Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Textarea
              id="description"
              name="description"
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Share what your form is about, who is it for, and what information you would like to collect. And AI will do the rest!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exampleImages" className="text-sm font-medium">
              Example images (optional)
            </Label>
            <Input
              id="exampleImages"
              name="exampleImages"
              type="file"
              accept="image/*"
              multiple
            />
            <p className="text-xs text-muted-foreground">
              Attach one or more example images to guide the AI (e.g. sample
              profile photo, document layout).
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Form"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default FormGenerator;
