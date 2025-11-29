"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CurrentUser {
  id: string;
  email: string;
}

const SettingsPage = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple local-only toggles to illustrate settings UI
  const [pineconeEnabled, setPineconeEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiRequest<CurrentUser>("/auth/me")
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading user...</p>
          ) : user ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are not logged in.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pinecone">Use Pinecone semantic index</Label>
              <p className="text-xs text-muted-foreground">
                Local toggle only; backend currently auto-falls back when
                Pinecone is misconfigured.
              </p>
            </div>
            <Switch
              id="pinecone"
              checked={pineconeEnabled}
              onCheckedChange={setPineconeEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifs">Email notifications</Label>
              <p className="text-xs text-muted-foreground">
                Placeholder toggle for future integration.
              </p>
            </div>
            <Switch
              id="email-notifs"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
