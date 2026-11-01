// Convert an annual effective rate (%) to its monthly equivalent.
const monthlyRate = (pct) => Math.pow(1 + pct / 100, 1 / 12) - 1;

const MAX_MONTHS = 100 * 12;

export function simulate(p) {
  const fdShare = Math.min(Math.max(p.fdPct, 0), 100) / 100;
  const fdM = monthlyRate(p.fdRate);
  const eqM = monthlyRate(p.eqRate);

  // Accumulation: contributions at month-end, step-up applied once a year.
  let fd = 0;
  let eq = 0;
  let invested = 0;
  let contribution = p.monthly;
  for (let y = 0; y < p.years; y++) {
    for (let m = 0; m < 12; m++) {
      fd = fd * (1 + fdM) + contribution * fdShare;
      eq = eq * (1 + eqM) + contribution * (1 - fdShare);
      invested += contribution;
    }
    contribution *= 1 + p.stepUp / 100;
  }
  const corpus = fd + eq;

  // Withdrawal: today's income inflated to retirement; withdrawn at the
  // start of each month, raised by inflation every 12 months, no new savings.
  const inf = 1 + p.inflation / 100;
  const firstWithdrawal = p.income * Math.pow(inf, p.years);
  const postM = monthlyRate(p.postRate);
  let balance = corpus;
  let w = firstWithdrawal;
  let months = 0;
  while (months < MAX_MONTHS) {
    if (balance < w) {
      months += Math.max(balance, 0) / w; // partial final month
      break;
    }
    balance = (balance - w) * (1 + postM);
    months++;
    if (months % 12 === 0) w *= inf;
  }

  return {
    fd,
    eq,
    corpus,
    invested,
    firstWithdrawal,
    months,
    sustained: months >= MAX_MONTHS,
  };
}

export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

export function short(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return inr(n);
}

export function duration(months, sustained) {
  if (sustained) return "100+ years";
  let y = Math.floor(months / 12);
  let m = Math.round(months - y * 12);
  if (m === 12) { y += 1; m = 0; }
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (m || !y) parts.push(`${m} ${m === 1 ? "month" : "months"}`);
  return parts.join(" ");
}
