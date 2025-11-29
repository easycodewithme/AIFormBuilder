"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./button";
import Image from "next/image";
import Link from "next/link";
import { ThemeChange } from "./ThemeChange";
import { LayoutDashboard, Menu } from "lucide-react";
import { Palette, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Props = {};

const Header = (props: Props) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ id: string; email: string }>("/auth/me")
      .then((data) => {
        if (!cancelled) {
          setUserEmail(data.email);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserEmail(null);
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

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setUserEmail(null);
    } catch (err) {
      // ignore
    }
  };

  return (
    <header className="border bottom-1">
      <nav className="border-gray-200 px-4 py-3">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <Link href="/">
            <h1 className="md:text-2xl lg:text-2xl">AI Form Builder</h1>
          </Link>
          <div>
            {userEmail ? (
              <div className="flex items-center gap-1 md:gap-1 lg:gap-4">
                <ThemeChange />
                <Link href="/view-forms">
                  <Button variant="outline">
                    <span className="hidden md:inline">Dashboard</span>{" "}
                    <LayoutDashboard className="md:hidden" />
                  </Button>
                </Link>
                <span className="hidden md:inline text-sm text-muted-foreground">
                  {userEmail}
                </span>
                <Button type="button" onClick={handleLogout}>
                  <LogOut className="md:hidden" />
                  <span className="hidden md:block">Sign out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeChange />
                <Link href="/auth/login">
                  <Button variant="link" className="text-md">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline" className="text-md">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
          {/* // This is menu */}
          {/* <div className="md:hidden">
            <Menu />
          </div> */}
        </div>
      </nav>
    </header>
  );
};

export default Header;
