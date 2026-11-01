import { useMemo, useState } from "react";
import { simulate, inr, short, duration } from "./calc.js";

const n = (v) => (v === "" || Number.isNaN(Number(v)) ? 0 : Number(v));

function Field({ label, value, onChange, prefix, suffix, hint }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <span className="control">
        {prefix && <span className="affix">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="affix">{suffix}</span>}
      </span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

const DEFAULTS = {
  monthly: "25000",
  fdPct: "50",
  fdRate: "6",
  eqRate: "12",
  stepUp: "0",
  years: "30",
  income: "100000",
  inflation: "6",
  postRate: "6",
};

export default function App() {
  const [f, setF] = useState(DEFAULTS);
  const set = (key) => (v) => setF((s) => ({ ...s, [key]: v }));
  const eqPct = String(Math.round((100 - n(f.fdPct)) * 100) / 100);

  const r = useMemo(
    () =>
      simulate({
        monthly: n(f.monthly),
        fdPct: n(f.fdPct),
        fdRate: n(f.fdRate),
        eqRate: n(f.eqRate),
        stepUp: n(f.stepUp),
        years: Math.min(Math.max(Math.round(n(f.years)), 0), 60),
        income: n(f.income),
        inflation: n(f.inflation),
        postRate: n(f.postRate),
      }),
    [f]
  );

  return (
    <div className="page">
      <header className="top">Retirement Planner</header>

      <main className="layout">
        <section className="result" aria-live="polite">
          <p className="muted">Your savings will last</p>
          <h1 className="big">{duration(r.months, r.sustained)}</h1>
          <p className="muted">
            after retirement, withdrawing {inr(r.firstWithdrawal)}/month at the
            start ({inr(n(f.income))} in today's money, rising {n(f.inflation)}%
            a year).
          </p>

          <dl className="stats">
            <div><dt>Corpus at retirement</dt><dd>{short(r.corpus)}</dd></div>
            <div><dt>Total invested</dt><dd>{short(r.invested)}</dd></div>
            <div><dt>Growth earned</dt><dd>{short(r.corpus - r.invested)}</dd></div>
            <div><dt>Fixed deposits</dt><dd>{short(r.fd)}</dd></div>
            <div><dt>Equity</dt><dd>{short(r.eq)}</dd></div>
          </dl>

          <p className="note">
            Contributions are made at month-end and returns compound monthly.
            Withdrawals happen at the start of each month, and the remaining
            corpus keeps earning the post-retirement return. Taxes and fees are
            not included. This is an estimate, not financial advice.
          </p>
        </section>

        <section className="form">
          <h2>Investment</h2>
          <Field label="Monthly investment" prefix="₹" value={f.monthly} onChange={set("monthly")} />
          <div className="row">
            <Field label="Fixed deposit allocation" suffix="%" value={f.fdPct} onChange={set("fdPct")} />
            <Field label="Equity allocation" suffix="%" value={eqPct} onChange={(v) => set("fdPct")(String(100 - n(v)))} />
          </div>
          <div className="row">
            <Field label="FD return" suffix="% / yr" value={f.fdRate} onChange={set("fdRate")} />
            <Field label="Equity return" suffix="% / yr" value={f.eqRate} onChange={set("eqRate")} />
          </div>
          <div className="row">
            <Field label="Annual step-up" suffix="%" value={f.stepUp} onChange={set("stepUp")} hint="Yearly increase in your monthly amount" />
            <Field label="Years of investment" suffix="yrs" value={f.years} onChange={set("years")} hint="Up to 60" />
          </div>

          <h2>Retirement</h2>
          <Field label="Monthly income needed (today's value)" prefix="₹" value={f.income} onChange={set("income")} />
          <div className="row">
            <Field label="Inflation" suffix="% / yr" value={f.inflation} onChange={set("inflation")} />
            <Field label="Return after retirement" suffix="% / yr" value={f.postRate} onChange={set("postRate")} hint="Earned on the remaining corpus" />
          </div>
          <button type="button" className="reset" onClick={() => setF(DEFAULTS)}>
            Reset to defaults
          </button>
        </section>
      </main>
    </div>
  );
}
