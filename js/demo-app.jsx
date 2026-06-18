/* global React, ReactDOM */
const { useState, useEffect, useRef } = React;

/* ============================ data + logic ============================ */
const SYMPTOMS = [
  { id: "severeHeadache", label: "Severe / persistent headache", sev: "red" },
  { id: "vision", label: "Vision changes or blurriness", sev: "red" },
  { id: "chest", label: "Chest pain", sev: "red" },
  { id: "breath", label: "Shortness of breath", sev: "red" },
  { id: "faceSwell", label: "Swelling in face or hands", sev: "red" },
  { id: "belly", label: "Upper-belly pain", sev: "red" },
  { id: "mildHeadache", label: "Mild headache", sev: "mild" },
  { id: "footSwell", label: "Swollen feet / ankles", sev: "mild" },
  { id: "fatigue", label: "Unusual fatigue", sev: "mild" },
  { id: "sleep", label: "Trouble sleeping", sev: "mild" },
];

const STATES = {
  ok:    { key: "ok",    title: "You're on track", tag: "Normal", color: "var(--ok)", bg: "var(--ok-bg)", fill: 0.30, icon: "✓" },
  watch: { key: "watch", title: "Monitor closely", tag: "Monitor closely", color: "var(--watch)", bg: "var(--watch-bg)", fill: 0.64, icon: "◔" },
  alert: { key: "alert", title: "Contact your care team", tag: "Contact care team", color: "var(--coral-700)", bg: "var(--alert-bg)", fill: 1.0, icon: "!" },
};

function computeRisk(sys, dia, picked, pain) {
  const red = picked.filter((id) => SYMPTOMS.find((s) => s.id === id)?.sev === "red");
  const mild = picked.filter((id) => SYMPTOMS.find((s) => s.id === id)?.sev === "mild");
  const bpSevere = sys >= 160 || dia >= 110;
  const bpElevated = sys >= 140 || dia >= 90;
  const reasons = [];
  if (bpSevere) reasons.push("Blood pressure in the severe range");
  else if (bpElevated) reasons.push("Blood pressure is elevated");
  if (red.length) reasons.push(`${red.length} warning symptom${red.length > 1 ? "s" : ""} reported`);
  if (pain >= 8) reasons.push("High pain level");
  else if (pain >= 5 && reasons.length === 0) reasons.push("Moderate pain reported");
  if (mild.length && !red.length) reasons.push(`${mild.length} mild symptom${mild.length > 1 ? "s" : ""} reported`);

  let level = "ok";
  if (bpSevere || red.length > 0 || pain >= 8) level = "alert";
  else if (bpElevated || mild.length > 0 || pain >= 5) level = "watch";
  if (level === "ok") reasons.push("Readings and symptoms within a healthy range");
  return { level, reasons };
}

const NEXT_STEPS = {
  ok: ["Keep logging your blood pressure once a day", "Rest when you can and stay hydrated", "Check in again tomorrow — we'll keep watching with you"],
  watch: ["Sit and rest, then re-take your blood pressure in 1 hour", "Log that second reading in Laminar", "Your care team can see this entry and will reach out if the pattern continues"],
  alert: ["Contact your care team now — this entry has been flagged for them", "If you have severe symptoms, call your local emergency number", "Keep this reading handy; don't wait for your next scheduled visit"],
};

/* seed clinician panel */
const seedTrend = (base) => Array.from({ length: 6 }, (_, i) => ({
  day: `D${i + 1}`,
  sys: base.sys[i], dia: base.dia[i],
}));
const SEED = [
  { id: "p1", name: "Priya Anand", color: "#C9213B", age: "Day 9 postpartum", bp: "164/108", level: "alert", checkin: "18 min ago",
    sym: ["vision", "severeHeadache"], follow: "needs", pain: 6,
    trend: seedTrend({ sys: [128, 132, 138, 146, 155, 164], dia: [84, 86, 90, 98, 104, 108] }) },
  { id: "p2", name: "Dani Okafor", color: "#E0930B", age: "Day 4 postpartum", bp: "148/96", level: "watch", checkin: "42 min ago",
    sym: ["mildHeadache", "footSwell"], follow: "needs", pain: 4,
    trend: seedTrend({ sys: [130, 134, 140, 142, 146, 148], dia: [82, 86, 88, 92, 94, 96] }) },
  { id: "p3", name: "Sofia Reyes", color: "#138a63", age: "Day 12 postpartum", bp: "122/78", level: "ok", checkin: "1 hr ago",
    sym: ["fatigue"], follow: "stable", pain: 2,
    trend: seedTrend({ sys: [126, 124, 125, 123, 122, 122], dia: [82, 80, 81, 79, 78, 78] }) },
  { id: "p4", name: "Maren Holt", color: "#7A5AF8", age: "Day 6 postpartum", bp: "158/104", level: "watch", checkin: "2 hr ago",
    sym: ["mildHeadache"], follow: "contacted", pain: 3,
    trend: seedTrend({ sys: [136, 140, 148, 150, 154, 158], dia: [88, 92, 96, 98, 100, 104] }) },
  { id: "p5", name: "Tasha Boone", color: "#138a63", age: "Day 15 postpartum", bp: "118/74", level: "ok", checkin: "3 hr ago",
    sym: [], follow: "stable", pain: 1,
    trend: seedTrend({ sys: [120, 119, 121, 118, 117, 118], dia: [78, 76, 77, 75, 74, 74] }) },
];

const symLabel = (id) => SYMPTOMS.find((s) => s.id === id)?.label || id;
const isRed = (id) => SYMPTOMS.find((s) => s.id === id)?.sev === "red";

/* ============================ icons ============================ */
const I = {
  arrow: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
  heart: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c-4-2.5-7-6-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4-3 7.5-7 10z" /></svg>,
  steth: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3v6a5 5 0 0 0 10 0V3" /><path d="M5 3H3M15 3h2M10 19v-5" /><circle cx="18" cy="17" r="3" /><path d="M10 19a4 4 0 0 0 8 0v-2" /></svg>,
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>,
};

/* ============================ patient app ============================ */
function PatientApp({ onSubmit }) {
  const [step, setStep] = useState(0); // 0 bp, 1 symptoms, 2 pain, 3 analyzing, 4 result
  const [sys, setSys] = useState(128);
  const [dia, setDia] = useState(84);
  const [focus, setFocus] = useState(null);
  const [picked, setPicked] = useState([]);
  const [none, setNone] = useState(false);
  const [pain, setPain] = useState(null);
  const [result, setResult] = useState(null);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const toggle = (id) => {
    setNone(false);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const submit = () => {
    setStep(3);
    setTimeout(() => {
      const r = computeRisk(sys, dia, picked, pain ?? 0);
      setResult(r);
      setStep(4);
      onSubmit && onSubmit({ sys, dia, picked, pain: pain ?? 0, level: r.level, reasons: r.reasons });
    }, 1900);
  };

  const restart = () => {
    setStep(0); setSys(128); setDia(84); setPicked([]); setNone(false); setPain(null); setResult(null);
  };

  return (
    <div className="patient-wrap">
      <div className="device">
        <div className="device__notch"></div>
        <div className="screen">
          <div className="scr-top">
            <div>
              <div className="scr-greet">Good morning, Maya</div>
              <div className="scr-sub">Day 6 · Today's check-in</div>
            </div>
            <div className="scr-av">M</div>
          </div>

          {step < 3 && (
            <div className="prog">
              <span className={step >= 0 ? "on" : ""}></span>
              <span className={step >= 1 ? "on" : ""}></span>
              <span className={step >= 2 ? "on" : ""}></span>
            </div>
          )}

          {/* STEP 0 — blood pressure */}
          {step === 0 && (
            <div className="scr-body">
              <h2>What's your blood pressure?</h2>
              <p className="q-sub">Enter today's reading from your home monitor.</p>
              <div className="bp-inputs">
                <div className={"bp-field" + (focus === "s" ? " focus" : "")}>
                  <div className="blab">Systolic</div>
                  <div className="bp-num">
                    <input type="number" value={sys} onFocus={() => setFocus("s")} onBlur={() => setFocus(null)}
                      onChange={(e) => setSys(clamp(parseInt(e.target.value || 0), 60, 250))} />
                    <div className="stepper">
                      <button onClick={() => setSys((v) => clamp(v + 1, 60, 250))} aria-label="up">▲</button>
                      <button onClick={() => setSys((v) => clamp(v - 1, 60, 250))} aria-label="down">▼</button>
                    </div>
                  </div>
                  <div className="unit">mmHg</div>
                </div>
                <div className="bp-sep">/</div>
                <div className={"bp-field" + (focus === "d" ? " focus" : "")}>
                  <div className="blab">Diastolic</div>
                  <div className="bp-num">
                    <input type="number" value={dia} onFocus={() => setFocus("d")} onBlur={() => setFocus(null)}
                      onChange={(e) => setDia(clamp(parseInt(e.target.value || 0), 40, 160))} />
                    <div className="stepper">
                      <button onClick={() => setDia((v) => clamp(v + 1, 40, 160))} aria-label="up">▲</button>
                      <button onClick={() => setDia((v) => clamp(v - 1, 40, 160))} aria-label="down">▼</button>
                    </div>
                  </div>
                  <div className="unit">mmHg</div>
                </div>
              </div>
              <div className="quick-row">
                <span style={{ fontSize: ".8rem", color: "var(--ink-300)", fontWeight: 600, alignSelf: "center" }}>Try a scenario:</span>
                <button onClick={() => { setSys(118); setDia(76); }}>Healthy 118/76</button>
                <button onClick={() => { setSys(146); setDia(94); }}>Elevated 146/94</button>
                <button onClick={() => { setSys(166); setDia(112); }}>Severe 166/112</button>
              </div>
              <div className="scr-foot">
                <button className="scr-btn" onClick={() => setStep(1)}>Continue {I.arrow}</button>
              </div>
            </div>
          )}

          {/* STEP 1 — symptoms */}
          {step === 1 && (
            <div className="scr-body">
              <h2>How are you feeling?</h2>
              <p className="q-sub">Tap anything you've noticed today.</p>
              <div className="chips">
                {SYMPTOMS.map((s) => (
                  <button key={s.id} className={"chip" + (picked.includes(s.id) ? " on " + (s.sev === "mild" ? "mild" : "") : "")}
                    onClick={() => toggle(s.id)}>
                    {picked.includes(s.id) && <span className="ck">{I.check}</span>}
                    {s.label}
                  </button>
                ))}
                <button className={"chip none-chip" + (none ? " on" : "")}
                  onClick={() => { setNone(true); setPicked([]); }}>
                  {none && <span className="ck">{I.check}</span>}
                  None of these
                </button>
              </div>
              <div className="scr-foot">
                <button className="scr-btn" disabled={!none && picked.length === 0} onClick={() => setStep(2)}>Continue {I.arrow}</button>
                <button className="scr-back" onClick={() => setStep(0)}>Back</button>
              </div>
            </div>
          )}

          {/* STEP 2 — pain */}
          {step === 2 && (
            <div className="scr-body">
              <h2>Any pain right now?</h2>
              <p className="q-sub">0 means none, 10 means the worst you can imagine.</p>
              <div className="pain-scale">
                {Array.from({ length: 11 }, (_, n) => (
                  <button key={n} className={pain === n ? "on" : ""} onClick={() => setPain(n)}>{n}</button>
                ))}
              </div>
              <div className="pain-labels"><span>No pain</span><span>Worst pain</span></div>
              <div className="scr-foot">
                <button className="scr-btn" disabled={pain === null} onClick={submit}>See my result {I.arrow}</button>
                <button className="scr-back" onClick={() => setStep(1)}>Back</button>
              </div>
            </div>
          )}

          {/* STEP 3 — analyzing */}
          {step === 3 && (
            <div className="analyzing">
              <div className="pulse-ring"></div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem" }}>Reviewing your check-in…</div>
                <p style={{ marginTop: 8 }}>Comparing against your recent trend and postpartum thresholds.</p>
              </div>
            </div>
          )}

          {/* STEP 4 — result */}
          {step === 4 && result && <ResultView state={STATES[result.level]} reasons={result.reasons} sys={sys} dia={dia} picked={picked} pain={pain} onRestart={restart} />}
        </div>
      </div>
    </div>
  );
}

function ResultView({ state, reasons, sys, dia, picked, pain, onRestart }) {
  const R = 82, C = 2 * Math.PI * R;
  const [off, setOff] = useState(C);
  useEffect(() => { const t = setTimeout(() => setOff(C * (1 - state.fill)), 120); return () => clearTimeout(t); }, []);
  const redSyms = picked.filter(isRed);
  return (
    <div className="result">
      <div className="result__ring" style={{ position: "relative" }}>
        <svg className="ring-svg" width="190" height="190">
          <circle className="ring-bg" cx="95" cy="95" r={R} strokeWidth="13" />
          <circle className="ring-fg" cx="95" cy="95" r={R} strokeWidth="13" style={{ stroke: state.color }}
            strokeDasharray={C} strokeDashoffset={off} />
        </svg>
        <div className="ring-label">
          <div className="ic" style={{ color: state.color, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.4rem", lineHeight: 1 }}>{state.icon}</div>
          <div style={{ fontWeight: 700, fontSize: ".78rem", color: "var(--ink-500)", marginTop: 4 }}>{sys}/{dia} mmHg</div>
        </div>
      </div>

      <div className="result__badge">
        <div className="r-tag" style={{ background: state.bg, color: state.color }}><span style={{ width: 7, height: 7, borderRadius: 9, background: "currentColor" }}></span>{state.tag}</div>
        <div className="r-state" style={{ color: state.color }}>{state.title}</div>
      </div>

      <div className="next-steps" style={{ marginTop: 16 }}>
        <h4>Why</h4>
        <ul>
          {reasons.map((r, i) => (
            <li key={i}><span className="si" style={{ background: state.bg, color: state.color }}>{I.check}</span>{r}</li>
          ))}
        </ul>
      </div>

      <div className="next-steps">
        <h4>What to do next</h4>
        <ul>
          {NEXT_STEPS[state.key].map((s, i) => (
            <li key={i}><span className="si" style={{ background: "var(--coral-50)", color: "var(--coral-700)" }}>{i + 1}</span>{s}</li>
          ))}
        </ul>
      </div>

      <div className={"sent-banner" + (state.key === "alert" ? " urgent" : "")}>
        {I.check}
        <span>{state.key === "alert" ? "Flagged to your care team — they'll follow up today." : "Saved to your record. Your care team can see this entry."}</span>
      </div>

      <button className="scr-btn ghost" onClick={onRestart}>Log another check-in</button>
    </div>
  );
}

/* ============================ clinician dashboard ============================ */
function ClinicianDash({ extra }) {
  const patients = [...extra, ...SEED];
  const [filter, setFilter] = useState("all");
  const [selId, setSelId] = useState(patients[0]?.id);
  const [contacted, setContacted] = useState({});

  useEffect(() => { if (extra.length) setSelId(extra[0].id); }, [extra.length]);

  const shown = patients.filter((p) => filter === "all" || p.level === filter);
  const sel = patients.find((p) => p.id === selId) || shown[0];
  const counts = { alert: patients.filter((p) => p.level === "alert").length, watch: patients.filter((p) => p.level === "watch").length, ok: patients.filter((p) => p.level === "ok").length };

  return (
    <div className="dash">
      <div className="dash__head">
        <div>
          <h2>Care team · Postpartum panel</h2>
          <div className="sub">{patients.length} patients monitored · updated just now</div>
        </div>
        <div className="summ">
          <div className="summ-card alert"><div className="sn">{counts.alert}</div><div className="st"><span className="flag alert" style={{ padding: 0, background: "none" }}><span className="d"></span></span>Needs attention</div></div>
          <div className="summ-card watch"><div className="sn">{counts.watch}</div><div className="st">Monitor</div></div>
          <div className="summ-card ok"><div className="sn">{counts.ok}</div><div className="st">Stable</div></div>
        </div>
      </div>
      <div className="dash__body">
        <div className="plist">
          <div className="plist__filters">
            {[["all", "All"], ["alert", "Needs attention"], ["watch", "Monitor"], ["ok", "Stable"]].map(([k, l]) => (
              <button key={k} className={"fbtn" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          {shown.map((p) => (
            <div key={p.id} className={"prow" + (p.id === selId ? " sel" : "") + (p.fresh ? " fresh" : "")} onClick={() => setSelId(p.id)}>
              <div className="pav" style={{ background: p.color }}>{p.name.split(" ").map((n) => n[0]).join("")}</div>
              <div>
                <div className="pname">{p.name}{p.fresh && <span style={{ color: "var(--coral-700)", fontWeight: 700, fontSize: ".75rem" }}> · new</span>}</div>
                <div className="pmeta">{p.age} · {p.checkin}</div>
              </div>
              <div className="pright">
                <span className={"flag " + p.level}><span className="d"></span>{p.level === "alert" ? "Attention" : p.level === "watch" ? "Monitor" : "Stable"}</span>
                <span className="pbp">{p.bp}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="detail">
          {sel ? <PatientDetail p={sel} contacted={contacted[sel.id]} onContact={() => setContacted((c) => ({ ...c, [sel.id]: true }))} /> :
            <div className="detail__empty">Select a patient to review their check-in.</div>}
        </div>
      </div>
    </div>
  );
}

function PatientDetail({ p, contacted, onContact }) {
  const st = STATES[p.level];
  const rec = {
    alert: { h: "Recommend prompt outreach", t: "Severe-range reading with warning symptoms. Call the patient today and review for postpartum preeclampsia per protocol." },
    watch: { h: "Keep a closer eye", t: "Elevated trend. Ask for a repeat reading in a few hours and confirm medication adherence." },
    ok: { h: "Recovering well", t: "Readings and symptoms within a healthy range. Continue routine daily monitoring." },
  }[p.level];

  return (
    <div>
      <div className="detail__head">
        <div className="pav" style={{ background: p.color }}>{p.name.split(" ").map((n) => n[0]).join("")}</div>
        <div>
          <h3>{p.name}</h3>
          <div className="dh-sub">{p.age} · last check-in {p.checkin}</div>
        </div>
      </div>
      <div className="detail__flag">
        <span className={"flag " + p.level} style={{ fontSize: ".82rem", padding: "7px 13px" }}><span className="d"></span>{st.tag} · {p.bp} mmHg</span>
      </div>

      <div className="trend">
        <h4>Blood pressure · last 6 days</h4>
        <Trend data={p.trend} />
        <div className="trend__legend">
          <span><i style={{ background: "var(--coral)" }}></i>Systolic</span>
          <span><i style={{ background: "var(--ink-500)" }}></i>Diastolic</span>
          <span><i style={{ background: "var(--coral-300)", height: 2 }}></i>140 / 90 threshold</span>
        </div>
      </div>

      <div className="dsec">
        <h4>Reported symptoms</h4>
        <div className="dsym">
          {p.sym.length ? p.sym.map((s) => <span key={s} className={isRed(s) ? "red" : ""}>{symLabel(s)}</span>) : <span>None reported</span>}
          {p.pain >= 5 && <span className={p.pain >= 8 ? "red" : ""}>Pain {p.pain}/10</span>}
        </div>
      </div>

      <div className={"rec " + p.level}>
        <div className="rec-ic" style={{ color: st.color }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></svg>
        </div>
        <div><h5>{rec.h}</h5><p>{rec.t}</p></div>
      </div>

      <div className="dactions">
        {contacted ? (
          <button className="dbtn done">{I.check} Marked contacted</button>
        ) : (
          <button className="dbtn primary" onClick={onContact}>{p.level === "alert" ? "Call patient · mark contacted" : "Mark followed up"}</button>
        )}
        <button className="dbtn sec">Open full chart</button>
      </div>
    </div>
  );
}

function Trend({ data }) {
  const W = 100, H = 64, pad = 6;
  const all = data.flatMap((d) => [d.sys, d.dia]);
  const min = Math.min(...all, 70) - 4, max = Math.max(...all, 145) + 4;
  const x = (i) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const line = (k) => data.map((d, i) => `${x(i)},${y(d[k])}`).join(" ");
  const thY = y(140);
  return (
    <div className="trend__chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="120" preserveAspectRatio="none">
        <line x1={pad} y1={thY} x2={W - pad} y2={thY} stroke="var(--coral-300)" strokeWidth="0.7" strokeDasharray="2 2" />
        <polyline points={line("dia")} fill="none" stroke="var(--ink-500)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={line("sys")} fill="none" stroke="var(--coral)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.sys)} r="1.7" fill="var(--coral)" />)}
        {data.map((d, i) => <circle key={"d" + i} cx={x(i)} cy={y(d.dia)} r="1.5" fill="var(--ink-500)" />)}
      </svg>
    </div>
  );
}

/* ============================ shell ============================ */
function App() {
  const [view, setView] = useState("patient");
  const [extra, setExtra] = useState([]);

  const handleSubmit = (s) => {
    const entry = {
      id: "you" + Date.now(), name: "Maya Chen", color: "var(--coral)", age: "Day 6 postpartum", you: true,
      bp: `${s.sys}/${s.dia}`, level: s.level, checkin: "just now", sym: s.picked, pain: s.pain, fresh: true,
      follow: s.level === "alert" ? "needs" : "stable",
      trend: seedTrend({ sys: [120, 124, 122, 126, 128, s.sys], dia: [78, 80, 79, 82, 82, s.dia] }),
    };
    setExtra([entry]);
  };

  return (
    <React.Fragment>
      <div className="dnav">
        <div className="dnav__in">
          <a className="brand" href="index.html">
            <img src="assets/laminar-mark.png" alt="Laminar" />
            Laminar
          </a>
          <div className="seg">
            <button className={view === "patient" ? "on" : ""} onClick={() => setView("patient")}>{I.phone} Patient app</button>
            <button className={view === "clinic" ? "on" : ""} onClick={() => setView("clinic")}>{I.steth} Care team{extra.length ? <span style={{ marginLeft: 4, background: "rgba(255,255,255,.3)", borderRadius: 20, padding: "1px 7px", fontSize: ".72rem" }}>1</span> : null}</button>
          </div>
          <a className="dnav__back" href="index.html">{I.back} Back to site</a>
        </div>
      </div>
      <div className="demo-stage">
        {view === "patient" ? (
          <React.Fragment>
            <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 26px" }}>
              <span className="eyebrow" style={{ justifyContent: "center", marginBottom: 12 }}>Patient demo</span>
              <p style={{ color: "var(--ink-500)", fontSize: "1.02rem" }}>Walk through a daily check-in. Enter a reading, add how you feel, and see the plain-language result — then switch to <b style={{ color: "var(--coral-700)" }}>Care team</b> to see it land.</p>
            </div>
            <PatientApp onSubmit={handleSubmit} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ maxWidth: 760, margin: "0 auto 26px", textAlign: "center" }}>
              <span className="eyebrow" style={{ justifyContent: "center", marginBottom: 12 }}>Care-team demo</span>
              <p style={{ color: "var(--ink-500)", fontSize: "1.02rem" }}>How a clinic sees the whole postpartum panel at once — sorted by who needs attention first.{extra.length ? " Your submitted check-in is at the top." : " Submit a check-in in the Patient app and it appears here."}</p>
            </div>
            <ClinicianDash extra={extra} />
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
