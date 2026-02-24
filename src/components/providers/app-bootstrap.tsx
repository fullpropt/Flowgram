"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function AppBootstrap() {
  const initializeData = useAppStore((state) => state.initializeData);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return null;
}
