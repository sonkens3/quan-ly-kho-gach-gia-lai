"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatMoneyText(value: string | number | undefined) {
  const digits = onlyDigits(String(value ?? ""));

  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("vi-VN");
}

export function MoneyInput({
  name,
  defaultValue,
  placeholder = "0",
  className,
  required,
}: {
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const initialValue = useMemo(() => formatMoneyText(defaultValue), [defaultValue]);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const rawValue = onlyDigits(displayValue);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={rawValue} />
      <input
        className={cn(
          "h-10 w-full rounded-md border border-input bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          className,
        )}
        inputMode="numeric"
        required={required}
        value={displayValue}
        placeholder={placeholder}
        onChange={(event) => setDisplayValue(formatMoneyText(event.target.value))}
      />
      <span className="pointer-events-none absolute right-3 top-2.5 text-sm font-medium text-slate-400">
        đ
      </span>
    </div>
  );
}
