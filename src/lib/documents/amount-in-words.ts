const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];

const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function underThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r ? `${TENS[t]} ${ONES[r]}` : TENS[t];
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${ONES[h]} HUNDRED AND ${underThousand(r)}` : `${ONES[h]} HUNDRED`;
}

/** English amount in words for UAE documents (AED). */
export function amountInWords(amount: number, currency = "AED"): string {
  const rounded = Math.round(amount * 100) / 100;
  const whole = Math.floor(rounded);
  const fils = Math.round((rounded - whole) * 100);

  if (whole === 0 && fils === 0) return `ZERO ${currency} ONLY`;

  const parts: string[] = [];
  let n = whole;

  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    parts.push(`${underThousand(m)} MILLION`);
    n %= 1_000_000;
  }
  if (n >= 1_000) {
    const t = Math.floor(n / 1_000);
    parts.push(`${underThousand(t)} THOUSAND`);
    n %= 1_000;
  }
  if (n > 0) {
    if (parts.length) parts.push("AND");
    parts.push(underThousand(n));
  }

  let words = parts.join(" ").replace(/\s+/g, " ").trim();
  if (fils > 0) {
    words += ` AND ${fils}/100`;
  }
  return `${words} ${currency} ONLY`;
}
