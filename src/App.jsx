import React, { useState, useMemo } from "react";
import {
  ChevronLeft, Heart, Info, Flame, ArrowUpRight, ArrowDownRight,
  Home, BarChart3, Bitcoin, Globe, Receipt
} from "lucide-react";

/* ============================================================
   AJAIB · SECTOR REVAMP — HEATMAP VARIANT (light mode)
   Discovery-first / depth-on-demand.
   Encoding: TILE SIZE = market weight · TILE COLOR = today's change.
   Borrows Reku's icon-peek (+N companies) and Public's weight signal.
   Drill: heatmap tile → sector detail → stock detail.
   ============================================================ */

// ---- light palette (from attached design) ----
const C = {
  bg: "#FFFFFF",
  bg2: "#F5F7FA",
  ink: "#0F172A",
  t2: "#64748B",
  t3: "#94A3B8",
  line: "#E7EBF0",
  blue: "#2E6BE6",
  teal: "#12B5A6",
  up: "#159E67",
  upTile: "233,247,239",   // rgb for green tile
  down: "#E23A57",
  downTile: "253,235,238", // rgb for red tile
  flat: "#B4BDC9",
};

const MARKET = { name: "S&P 500", change: 0.42 };
const FLOOR = 2; // USD miliar cap floor

const idn = (n, d = 2) => Number(n).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n) => `${n >= 0 ? "+" : "−"}${idn(Math.abs(n), 2)}%`;
const usd = (n) => `$${idn(n, 2)}`;
const mcap = (b) => (b >= 1000 ? `$${idn(b / 1000, 1)} T` : b >= 1 ? `$${idn(b, 1)} M` : `$${idn(b * 1000, 0)} jt`);
const clr = (n) => (n > 0 ? C.up : n < 0 ? C.down : C.flat);

// tile background: base tint + intensity by magnitude
const tileBg = (c) => {
  const k = 0.10 + Math.min(Math.abs(c) / 4, 1) * 0.16;
  return c >= 0 ? `rgba(${C.upTile},${k})` : `rgba(${C.downTile},${k})`;
};
const tileBorder = (c) => (c >= 0 ? "rgba(21,158,103,0.22)" : "rgba(226,58,87,0.22)");

// ---- data (shared with list variant) ----
const SECTORS = [
  { id: "tek", name: "Teknologi", w: 31.6, change: 1.24, adv: 58, unch: 3, dec: 19,
    reason: "Semikonduktor memimpin; produsen chip AI naik setelah panduan capex dinaikkan.",
    subs: [{ name: "Semikonduktor", w: 42, r: 2.1 }, { name: "Perangkat Lunak", w: 33, r: 0.7 }, { name: "Perangkat Keras", w: 15, r: 0.4 }, { name: "Layanan TI", w: 10, r: 0.3 }],
    movers: [
      { t: "NVDA", n: "Nvidia", p: 182.40, c: 1.82, m: 4900, s: "Semikonduktor" },
      { t: "AVGO", n: "Broadcom", p: 288.10, c: 2.41, m: 1350, s: "Semikonduktor" },
      { t: "MSFT", n: "Microsoft", p: 505.60, c: 0.62, m: 3760, s: "Perangkat Lunak" },
      { t: "AMD", n: "Adv. Micro Devices", p: 172.30, c: 3.05, m: 279, s: "Semikonduktor" },
      { t: "AAPL", n: "Apple", p: 234.80, c: 0.38, m: 3550, s: "Perangkat Keras" },
      { t: "CRM", n: "Salesforce", p: 268.90, c: 0.91, m: 258, s: "Perangkat Lunak" },
      { t: "QUBT", n: "Quantum Computing", p: 12.40, c: 42.60, m: 0.9, s: "Perangkat Keras" },
      { t: "BBAI", n: "BigBear.ai", p: 4.85, c: 33.20, m: 1.3, s: "Perangkat Lunak" }] },
  { id: "keu", name: "Keuangan", w: 13.9, change: 0.31, adv: 44, unch: 3, dec: 25,
    reason: "Bank besar stabil saat imbal hasil obligasi 10-tahun mereda.",
    subs: [{ name: "Bank", w: 34, r: 0.3 }, { name: "Jasa Keuangan", w: 24, r: 0.5 }, { name: "Asuransi", w: 22, r: 0.1 }, { name: "Pasar Modal", w: 20, r: 0.7 }],
    movers: [
      { t: "BRK-B", n: "Berkshire Hathaway", p: 492.30, c: 0.12, m: 1060, s: "Jasa Keuangan" },
      { t: "JPM", n: "JPMorgan Chase", p: 298.40, c: 0.42, m: 820, s: "Bank" },
      { t: "V", n: "Visa", p: 352.10, c: 0.58, m: 690, s: "Jasa Keuangan" },
      { t: "BAC", n: "Bank of America", p: 48.90, c: 0.31, m: 370, s: "Bank" },
      { t: "GS", n: "Goldman Sachs", p: 612.80, c: 0.74, m: 190, s: "Pasar Modal" }] },
  { id: "kns", name: "Konsumen Non-Primer", w: 10.3, change: 0.52, adv: 35, unch: 2, dec: 28,
    reason: "Ritel internet & otomotif menopang; belanja diskresioner stabil.",
    subs: [{ name: "Ritel Internet", w: 40, r: 0.7 }, { name: "Otomotif", w: 18, r: 0.9 }, { name: "Restoran", w: 16, r: -0.1 }, { name: "Ritel", w: 14, r: 0.2 }, { name: "Perjalanan", w: 12, r: 0.4 }],
    movers: [
      { t: "AMZN", n: "Amazon", p: 224.60, c: 0.72, m: 2340, s: "Ritel Internet" },
      { t: "TSLA", n: "Tesla", p: 428.90, c: 0.88, m: 1370, s: "Otomotif" },
      { t: "HD", n: "Home Depot", p: 412.30, c: 0.21, m: 410, s: "Ritel" },
      { t: "MCD", n: "McDonald's", p: 305.40, c: -0.12, m: 218, s: "Restoran" }] },
  { id: "kom", name: "Layanan Komunikasi", w: 9.4, change: 0.86, adv: 12, unch: 0, dec: 8,
    reason: "GOOGL & META naik jelang musim laba; iklan digital menguat.",
    subs: [{ name: "Media Interaktif", w: 62, r: 1.0 }, { name: "Hiburan", w: 22, r: 0.3 }, { name: "Telekomunikasi", w: 16, r: -0.2 }],
    movers: [
      { t: "GOOGL", n: "Alphabet", p: 205.30, c: 1.12, m: 2480, s: "Media Interaktif" },
      { t: "META", n: "Meta Platforms", p: 712.40, c: 0.94, m: 1810, s: "Media Interaktif" },
      { t: "NFLX", n: "Netflix", p: 1180.20, c: 0.66, m: 500, s: "Hiburan" },
      { t: "DIS", n: "Walt Disney", p: 112.80, c: -0.42, m: 205, s: "Hiburan" }] },
  { id: "kes", name: "Kesehatan", w: 9.1, change: -0.14, adv: 28, unch: 3, dec: 34,
    reason: "Farmasi tertekan sentimen kebijakan harga obat; alat kesehatan menguat tipis.",
    subs: [{ name: "Farmasi", w: 40, r: 0.1 }, { name: "Layanan Kesehatan", w: 28, r: -0.5 }, { name: "Alat Kesehatan", w: 20, r: 0.2 }, { name: "Bioteknologi", w: 12, r: 0.4 }],
    movers: [
      { t: "LLY", n: "Eli Lilly", p: 812.40, c: 0.22, m: 770, s: "Farmasi" },
      { t: "UNH", n: "UnitedHealth", p: 528.60, c: -0.64, m: 485, s: "Layanan Kesehatan" },
      { t: "JNJ", n: "Johnson & Johnson", p: 168.20, c: -0.18, m: 405, s: "Farmasi" },
      { t: "ABBV", n: "AbbVie", p: 198.50, c: 0.34, m: 350, s: "Farmasi" }] },
  { id: "ind", name: "Industri", w: 8.7, change: 0.61, adv: 40, unch: 4, dec: 30,
    reason: "Kedirgantaraan menguat; pesanan pesawat baru menopang GE & BA.",
    subs: [{ name: "Kedirgantaraan", w: 30, r: 1.3 }, { name: "Jasa Komersial", w: 28, r: 0.2 }, { name: "Mesin", w: 22, r: 0.3 }, { name: "Transportasi", w: 20, r: 0.5 }],
    movers: [
      { t: "GE", n: "GE Aerospace", p: 268.40, c: 1.24, m: 285, s: "Kedirgantaraan" },
      { t: "BA", n: "Boeing", p: 214.60, c: 1.86, m: 162, s: "Kedirgantaraan" },
      { t: "UBER", n: "Uber", p: 92.40, c: 0.58, m: 193, s: "Transportasi" },
      { t: "CAT", n: "Caterpillar", p: 418.20, c: 0.32, m: 198, s: "Mesin" }] },
  { id: "ene", name: "Energi", w: 3.9, change: 0.07, adv: 12, unch: 1, dec: 10,
    reason: "Harga minyak nyaris datar; sektor bergerak tipis sepanjang sesi.",
    subs: [{ name: "Minyak & Gas Hulu", w: 55, r: 0.1 }, { name: "Peralatan & Jasa", w: 25, r: 0.3 }, { name: "Penyulingan", w: 20, r: -0.1 }],
    movers: [
      { t: "XOM", n: "Exxon Mobil", p: 118.60, c: 0.14, m: 512, s: "Minyak & Gas Hulu" },
      { t: "CVX", n: "Chevron", p: 162.30, c: -0.08, m: 292, s: "Minyak & Gas Hulu" },
      { t: "COP", n: "ConocoPhillips", p: 102.80, c: 0.22, m: 128, s: "Minyak & Gas Hulu" }] },
  { id: "bhn", name: "Bahan Baku", w: 2.5, change: 0.94, adv: 22, unch: 1, dec: 6,
    reason: "Tambang emas & tembaga melonjak seiring pelemahan dolar AS.",
    subs: [{ name: "Logam Mulia", w: 38, r: 2.6 }, { name: "Logam Industri", w: 30, r: 2.9 }, { name: "Kimia", w: 26, r: 0.5 }, { name: "Kertas & Kemasan", w: 6, r: -0.2 }],
    movers: [
      { t: "SCCO", n: "Southern Copper", p: 180.74, c: 3.21, m: 141, s: "Logam Industri" },
      { t: "NEM", n: "Newmont", p: 61.20, c: 2.93, m: 68, s: "Logam Mulia" },
      { t: "FCX", n: "Freeport-McMoRan", p: 52.40, c: 2.84, m: 75, s: "Logam Industri" },
      { t: "AEM", n: "Agnico Eagle", p: 140.08, c: 2.80, m: 70, s: "Logam Mulia" },
      { t: "NAK", n: "Northern Dynasty", p: 0.68, c: 58.40, m: 0.4, s: "Logam Mulia" }] },
  { id: "pro", name: "Properti", w: 2.2, change: -0.08, adv: 9, unch: 1, dec: 20,
    reason: "REIT tertahan ekspektasi suku bunga tetap tinggi lebih lama.",
    subs: [{ name: "REIT Infrastruktur", w: 26, r: 0.1 }, { name: "REIT Industri", w: 24, r: -0.1 }, { name: "REIT Ritel", w: 20, r: -0.3 }, { name: "REIT Hunian", w: 18, r: -0.2 }, { name: "REIT Kantor", w: 12, r: -0.5 }],
    movers: [
      { t: "PLD", n: "Prologis", p: 118.40, c: -0.12, m: 110, s: "REIT Industri" },
      { t: "AMT", n: "American Tower", p: 205.60, c: 0.08, m: 96, s: "REIT Infrastruktur" },
      { t: "SPG", n: "Simon Property", p: 178.30, c: -0.24, m: 66, s: "REIT Ritel" }] },
  { id: "uti", name: "Utilitas", w: 2.0, change: -0.21, adv: 6, unch: 2, dec: 22,
    reason: "Sektor defensif melemah saat selera risiko investor meningkat.",
    subs: [{ name: "Listrik", w: 62, r: -0.2 }, { name: "Gas", w: 20, r: -0.1 }, { name: "Air", w: 10, r: 0.1 }, { name: "Terbarukan", w: 8, r: -0.4 }],
    movers: [
      { t: "NEE", n: "NextEra Energy", p: 78.40, c: -0.18, m: 161, s: "Listrik" },
      { t: "SO", n: "Southern Company", p: 89.60, c: -0.14, m: 98, s: "Listrik" },
      { t: "DUK", n: "Duke Energy", p: 118.20, c: -0.22, m: 91, s: "Listrik" }] },
];

const TFS = ["1 Hr", "1 Mg", "1 Bln", "3 Bln", "1 Th"];
const total = (s) => s.adv + s.unch + s.dec;
const sizeOf = (w) => (w >= 20 ? 3 : w >= 9 ? 2 : 1);

function walk(seed, n, endBias) {
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
  const p = []; let v = 0;
  for (let i = 0; i < n; i++) { v += (rnd() - 0.5) * 2; p.push(v + endBias * (i / (n - 1))); }
  return p;
}

// ---- shared bits ----
function Avatar({ t, size = 34 }) {
  const hue = [...t].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flex: `0 0 ${size}px`,
      background: `hsl(${hue} 55% 92%)`, color: `hsl(${hue} 55% 34%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, border: "1px solid rgba(0,0,0,0.04)",
    }}>{t.slice(0, 3)}</div>
  );
}
function StackIcons({ s }) {
  const tks = s.movers.slice(0, 3).map((m) => m.t);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {tks.map((t, i) => {
        const hue = [...t].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
        return <span key={t} style={{
          width: 22, height: 22, borderRadius: "50%", marginLeft: i ? -8 : 0,
          background: `hsl(${hue} 55% 90%)`, color: `hsl(${hue} 55% 34%)`, border: "2px solid #fff",
          fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 - i,
        }}>{t.slice(0, 2)}</span>;
      })}
      <span style={{
        marginLeft: 6, fontSize: 11, fontWeight: 700, color: C.t2,
        background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, padding: "2px 8px",
      }}>{total(s)} saham</span>
    </div>
  );
}
function Breadth({ s, h = 5 }) {
  const t = total(s) || 1;
  return (
    <div style={{ display: "flex", height: h, borderRadius: h, overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
      <div style={{ width: `${(s.adv / t) * 100}%`, background: C.up }} />
      <div style={{ width: `${(s.unch / t) * 100}%`, background: C.flat }} />
      <div style={{ width: `${(s.dec / t) * 100}%`, background: C.down }} />
    </div>
  );
}
function RelChip({ change }) {
  const d = +(change - MARKET.change).toFixed(2);
  const up = d >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, color: up ? C.up : C.down,
      background: up ? "rgba(21,158,103,0.10)" : "rgba(226,58,87,0.10)",
    }}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {up ? "Unggul" : "Tertinggal"} {pct(d)} <span style={{ color: C.t3, fontWeight: 500 }}>vs {MARKET.name}</span>
    </span>
  );
}
function Trend({ seed, change, tfIdx, id }) {
  const n = [24, 30, 30, 36, 24][tfIdx];
  const pts = walk(seed * 7 + tfIdx * 13, n, change >= 0 ? 3.2 : -3.2);
  const min = Math.min(...pts), max = Math.max(...pts), rng = max - min || 1;
  const W = 320, H = 92, pad = 4;
  const xy = pts.map((p, i) => [pad + (i / (n - 1)) * (W - pad * 2), pad + (1 - (p - min) / rng) * (H - pad * 2)]);
  const line = xy.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const col = change >= 0 ? C.up : C.down;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }} preserveAspectRatio="none">
      <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={col} stopOpacity="0.16" /><stop offset="100%" stopColor={col} stopOpacity="0" />
      </linearGradient></defs>
      <path d={`${line} L${W - pad},${H} L${pad},${H} Z`} fill={`url(#g${id})`} />
      <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---- screen 1: heatmap ----
function Heatmap({ onOpen }) {
  const tiles = useMemo(() => [...SECTORS].sort((a, b) => b.w - a.w), []);
  const hot = useMemo(() => {
    return new Set([...SECTORS].sort((a, b) => Math.abs(b.change) * b.w - Math.abs(a.change) * a.w).slice(0, 3).map((s) => s.id));
  }, []);
  return (
    <>
      <div style={{ padding: "8px 16px 2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 6 }}>
          Sektor & Industri <Flame size={17} color="#F59E0B" fill="#F59E0B" />
        </h1>
        <span style={{ color: C.blue, fontSize: 13, fontWeight: 600 }}>Lihat Semua</span>
      </div>
      <div style={{ padding: "2px 16px 8px", fontSize: 12.5, color: C.t2 }}>
        {MARKET.name} <span style={{ color: clr(MARKET.change), fontWeight: 600 }}>{pct(MARKET.change)}</span>
        <span style={{ color: C.t3 }}> · ukuran = bobot pasar · warna = hari ini</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "62px", gridAutoFlow: "dense", gap: 10, padding: "6px 14px 4px" }}>
        {tiles.map((s) => {
          const sp = sizeOf(s.w);
          return (
            <button key={s.id} className="tile" onClick={() => onOpen(s)}
              style={{
                gridRow: `span ${sp}`, background: tileBg(s.change), border: `1px solid ${tileBorder(s.change)}`,
                borderRadius: 16, padding: 13, cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8, minWidth: 0,
              }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 6 }}>
                  <span style={{ fontSize: sp >= 2 ? 15 : 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{s.name}</span>
                  {hot.has(s.id) && <Flame size={14} color="#F59E0B" fill="#F59E0B" style={{ flex: "0 0 14px", marginTop: 2 }} />}
                </div>
                <div style={{ marginTop: 4, fontSize: sp >= 2 ? 17 : 14, fontWeight: 700, color: clr(s.change), fontVariantNumeric: "tabular-nums" }}>
                  {pct(s.change)}
                </div>
              </div>
              <div>
                {sp >= 2 && <div style={{ marginBottom: 8 }}><Breadth s={s} /></div>}
                <StackIcons s={s} />
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ padding: "8px 20px 16px", fontSize: 10.5, lineHeight: 1.5, color: C.t3 }}>
        Data untuk tujuan informasi, bukan rekomendasi jual/beli. Perubahan harga dapat tertunda.
      </p>
    </>
  );
}

// ---- screen 2: sector detail ----
function Sector({ s, onBack, onStock }) {
  const [tf, setTf] = useState(1);
  const [sub, setSub] = useState(null);
  const [filterMicro, setFilterMicro] = useState(true);
  const seed = [...s.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const movers = useMemo(() => {
    let m = [...s.movers];
    if (sub) m = m.filter((x) => x.s === sub);
    if (filterMicro) m = m.filter((x) => x.m >= FLOOR);
    return m.sort((a, b) => b.c - a.c);
  }, [s, sub, filterMicro]);
  const hidden = s.movers.filter((x) => x.m < FLOOR).length;

  return (
    <>
      <TopBar title={s.name} onBack={onBack} />
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: clr(s.change), letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{pct(s.change)}</div>
        <div style={{ margin: "8px 0 12px" }}><RelChip change={s.change} /></div>
        <Breadth s={s} h={7} />
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.t2, marginTop: 7 }}>
          <span style={{ color: C.up }}>▲ {s.adv} naik</span><span>■ {s.unch} tetap</span><span style={{ color: C.down }}>▼ {s.dec} turun</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
          <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: "rgba(18,181,166,0.4)", flex: "0 0 3px" }} />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: C.t2 }}>{s.reason}</p>
        </div>
      </div>

      <div style={{ padding: "6px 16px 4px" }}>
        <Trend seed={seed} change={s.change} tfIdx={tf} id={s.id} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {TFS.map((label, i) => (
            <button key={label} onClick={() => setTf(i)} className="pill"
              style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", color: tf === i ? C.ink : C.t3, background: tf === i ? C.bg2 : "transparent" }}>{label}</button>
          ))}
        </div>
      </div>

      <Section title={`Industri dalam ${s.name}`} note="bobot · hari ini">
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: C.t3 }}>Ketuk industri untuk menyaring penggerak di bawah.</p>
        {s.subs.map((b) => {
          const on = sub === b.name;
          return (
            <button key={b.name} onClick={() => setSub(on ? null : b.name)} className="row"
              style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "block", background: on ? C.bg2 : "transparent", border: "none", borderRadius: 10, padding: "9px 8px", marginBottom: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: on ? C.teal : C.ink }}>{b.name}</span>
                <span style={{ display: "flex", gap: 10, fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: C.t3 }}>{idn(b.w, 0)}%</span>
                  <span style={{ color: clr(b.r), fontWeight: 600, width: 52, textAlign: "right" }}>{pct(b.r)}</span>
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: C.line, overflow: "hidden" }}>
                <div style={{ width: `${b.w}%`, height: "100%", background: b.r >= 0 ? C.up : C.down, opacity: 0.9 }} />
              </div>
            </button>
          );
        })}
      </Section>

      <div style={{ padding: "16px 16px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>Penggerak utama{sub ? ` · ${sub}` : ""}</h2>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.t2, cursor: "pointer" }}>
            <span>Saring kap. mikro</span>
            <span onClick={() => setFilterMicro((v) => !v)} role="switch" aria-checked={filterMicro}
              style={{ width: 34, height: 20, borderRadius: 999, position: "relative", flex: "0 0 34px", background: filterMicro ? C.teal : C.line, transition: "background .15s" }}>
              <span style={{ position: "absolute", top: 2, left: filterMicro ? 16 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", transition: "left .15s" }} />
            </span>
          </label>
        </div>
        {movers.map((m) => (
          <button key={m.t} onClick={() => onStock(m, s)} className="row"
            style={{ width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "10px 6px", background: "transparent", border: "none", borderBottom: `1px solid ${C.line}` }}>
            <Avatar t={m.t} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{m.t}</span>
                {m.m < FLOOR && <span style={{ fontSize: 9, fontWeight: 700, color: C.down, background: "rgba(226,58,87,0.10)", padding: "1px 5px", borderRadius: 4 }}>KAP. MIKRO</span>}
              </div>
              <div style={{ fontSize: 11.5, color: C.t3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.n} · {mcap(m.m)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{usd(m.p)}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: clr(m.c), fontVariantNumeric: "tabular-nums" }}>{pct(m.c)}</div>
            </div>
          </button>
        ))}
        {movers.length === 0 && <p style={{ fontSize: 12.5, color: C.t3, padding: "8px 0" }}>Tidak ada saham pada industri ini di atas ambang kapitalisasi.</p>}
        <p style={{ margin: "10px 0 0", fontSize: 10.5, lineHeight: 1.5, color: C.t3, display: "flex", gap: 5 }}>
          <Info size={12} style={{ flex: "0 0 12px", marginTop: 1 }} />
          {filterMicro ? `Menyaring ${hidden} saham berkap. mikro (< $2 M) untuk mengurangi noise. Matikan untuk melihat semua.` : `Menampilkan semua. Nama berkap. mikro sering bergerak ekstrem karena likuiditas rendah — bukan sinyal sektor.`}
        </p>
      </div>
      <Disclaimer />
    </>
  );
}

// ---- screen 3: stock detail (asset drill) ----
function Stock({ m, s, onBack }) {
  const [tf, setTf] = useState(1);
  const seed = [...m.t].reduce((a, c) => a + c.charCodeAt(0), 0);
  const Stat = ({ k, v }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{v}</div>
    </div>
  );
  return (
    <>
      <TopBar title={m.t} onBack={onBack} />
      <div style={{ padding: "16px 16px 4px", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar t={m.t} size={44} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{m.n}</div>
          <div style={{ fontSize: 12, color: C.t3 }}>{s.name} · {m.s}</div>
        </div>
      </div>
      <div style={{ padding: "6px 16px 4px" }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{usd(m.p)}</span>
        <span style={{ marginLeft: 10, fontSize: 15, fontWeight: 700, color: clr(m.c) }}>{pct(m.c)}</span>
        <span style={{ marginLeft: 6, fontSize: 12, color: C.t3 }}>hari ini</span>
      </div>
      {m.m < FLOOR && (
        <div style={{ margin: "10px 16px", padding: "10px 12px", borderRadius: 12, background: "rgba(226,58,87,0.07)", border: "1px solid rgba(226,58,87,0.2)", fontSize: 11.5, color: "#9A2A3E", display: "flex", gap: 7 }}>
          <Info size={14} style={{ flex: "0 0 14px", marginTop: 1 }} />
          Kapitalisasi mikro ({mcap(m.m)}). Likuiditas rendah membuat harga bisa bergerak ekstrem — perubahan besar belum tentu mencerminkan tren.
        </div>
      )}
      <div style={{ padding: "8px 16px 4px" }}>
        <Trend seed={seed} change={m.c} tfIdx={tf} id={m.t} />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {TFS.map((label, i) => (
            <button key={label} onClick={() => setTf(i)} className="pill" style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", color: tf === i ? C.ink : C.t3, background: tf === i ? C.bg2 : "transparent" }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "16px 16px 4px" }}>
        <Stat k="Kap. Pasar" v={mcap(m.m)} /><Stat k="Sektor" v={s.name} /><Stat k="Industri" v={m.s} />
      </div>
      <Disclaimer />
      <div style={{ display: "flex", gap: 10, padding: "8px 16px 18px" }}>
        <button className="pill" style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Pantau</button>
        <button className="pill" style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: C.teal, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Perdagangkan</button>
      </div>
    </>
  );
}

// ---- reusable chrome ----
function TopBar({ title, onBack }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 5, background: C.bg, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: `1px solid ${C.line}` }}>
      <button className="icn" onClick={onBack} aria-label="Kembali" style={{ background: "none", border: "none", cursor: "pointer", color: C.ink, padding: 4, display: "flex" }}><ChevronLeft size={24} /></button>
      <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, flex: 1 }}>{title}</span>
      <Heart size={20} color={C.t3} />
    </div>
  );
}
function Section({ title, note, children }) {
  return (
    <div style={{ padding: "16px 16px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>{title}</h2>
        {note && <span style={{ fontSize: 11, color: C.t3 }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}
function Disclaimer() {
  return <p style={{ padding: "14px 20px 4px", fontSize: 10.5, lineHeight: 1.5, color: C.t3 }}>Data untuk tujuan informasi, bukan rekomendasi jual/beli.</p>;
}

// ---- shell ----
export default function App() {
  const [view, setView] = useState({ screen: "heatmap" });
  const nav = [["Beranda", Home], ["Pasar", BarChart3], ["Kripto", Bitcoin], ["Saham AS", Globe], ["Transaksi", Receipt]];
  return (
    <div style={{ minHeight: "100vh", background: "#DCE3EC", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 20, fontFamily: "Inter, -apple-system, system-ui, sans-serif" }}>
      <style>{`
        *{box-sizing:border-box}
        .scroll::-webkit-scrollbar{width:0}
        .tile:active,.row:active{transform:scale(0.99)}
        .pill:focus-visible,.row:focus-visible,.tile:focus-visible,.icn:focus-visible{outline:2px solid ${C.teal};outline-offset:2px}
        @media (prefers-reduced-motion: reduce){*{transition:none!important}}
      `}</style>
      <div style={{ width: 390, height: 830, background: C.bg, borderRadius: 34, overflow: "hidden", border: "1px solid #C6D0DC", boxShadow: "0 30px 80px rgba(30,50,80,0.28)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px 6px", fontSize: 12, color: C.t2, fontWeight: 600 }}>
          <span>15.45</span><span>Saham AS · Ajaib</span>
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {view.screen === "heatmap" && <Heatmap onOpen={(s) => setView({ screen: "sector", s })} />}
          {view.screen === "sector" && <Sector s={view.s} onBack={() => setView({ screen: "heatmap" })} onStock={(m, s) => setView({ screen: "stock", m, s })} />}
          {view.screen === "stock" && <Stock m={view.m} s={view.s} onBack={() => setView({ screen: "sector", s: view.s })} />}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 6px 12px", background: C.bg, borderTop: `1px solid ${C.line}` }}>
          {nav.map(([lbl, Icon], i) => {
            const active = i === 3;
            return (
              <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <Icon size={20} color={active ? C.teal : C.t3} />
                <span style={{ fontSize: 9, color: active ? C.teal : C.t3, fontWeight: active ? 700 : 500 }}>{lbl}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
