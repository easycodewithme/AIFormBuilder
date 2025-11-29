"use client";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useEffect, useState } from "react";
import {
  slateTheme,
  violetTheme,
  redTheme,
  blueTheme,
  orangeTheme,
  neutralTheme,
} from "@/actions/theme";
import { Palette } from "lucide-react";

export function ThemeChange() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const storedThemeString = window.localStorage.getItem(
        "ai-form-builder-theme"
      );
      return storedThemeString ? JSON.parse(storedThemeString) : slateTheme;
    }
    return slateTheme;
  });

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === "string") {
        document.documentElement.style.setProperty(`--${key}`, value as string);
      }
    });
  }, [theme]);

  const handleSelectTheme = (selectedTheme: any) => {
    if (selectedTheme === "Slate") {
      setTheme(slateTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(slateTheme)
        );
      }
    } else if (selectedTheme === "Violet") {
      setTheme(violetTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(violetTheme)
        );
      }
    } else if (selectedTheme === "Red") {
      setTheme(redTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(redTheme)
        );
      }
    } else if (selectedTheme == "Blue") {
      setTheme(blueTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(blueTheme)
        );
      }
    } else if (selectedTheme == "Orange") {
      setTheme(orangeTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(orangeTheme)
        );
      }
    } else if (selectedTheme == "Neutral") {
      setTheme(neutralTheme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "ai-form-builder-theme",
          JSON.stringify(neutralTheme)
        );
      }
    }
  };

  const handleChange = (e: any) => {
    handleSelectTheme(e.target.textContent);
    console.log("Selected Theme:", e.target.textContent);
  };
  return (
    <Menubar className="hover:cursor-pointer" onClick={(e) => handleChange(e)}>
      <MenubarMenu>
        {/* <MenubarTrigger>
          Themes <Palette />
        </MenubarTrigger> */}
        <MenubarTrigger>
          <span className="flex items-center">
            <span className="mr-2">
              <Palette />
            </span>
            <span className="hidden md:inline-block">Themes</span>
          </span>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup onChange={handleChange}>
            <MenubarRadioItem value="slate">
              <span className="w-3 h-3 rounded-full bg-slate-900 mr-4"></span>
              Slate
            </MenubarRadioItem>
            <MenubarRadioItem value="red">
              <span className="w-3 h-3 rounded-full bg-red-900 mr-4"></span>
              Red
            </MenubarRadioItem>
            <MenubarRadioItem value="orange">
              <span className="w-3 h-3 rounded-full bg-orange-900 mr-4"></span>
              Orange
            </MenubarRadioItem>
            <MenubarRadioItem value="blue">
              <span className="w-3 h-3 rounded-full bg-blue-900 mr-4"></span>
              Blue
            </MenubarRadioItem>
            <MenubarRadioItem value="violet">
              <span className="w-3 h-3 rounded-full bg-violet-900 mr-4"></span>
              Violet
            </MenubarRadioItem>
            <MenubarRadioItem value="neautral">
              <span className="w-3 h-3 rounded-full bg-neutral-900 mr-4"></span>
              Neutral
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
