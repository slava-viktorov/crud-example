"use client";
import React from "react";

export function LocalizedDate({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <>{date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", "")}</>
  );
} 