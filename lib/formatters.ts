export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDateKeyFromDate(date: Date) {
  const parts = DATE_KEY_FORMATTER.formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }

    return result;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toDateKey(value: string | Date | number | null | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoDate = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (isoDate) {
      const [, year, month, day] = isoDate;
      return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    const vietnameseDate = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})(?:\s|$)/);

    if (vietnameseDate) {
      const [, day, month, rawYear] = vietnameseDate;
      const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateKeyFromDate(date);
}

export function formatDate(value: string | Date | number | null | undefined) {
  const key = toDateKey(value);

  if (!key) {
    return "-";
  }

  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}
