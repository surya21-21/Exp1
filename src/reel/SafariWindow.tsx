import React from "react";
import {interpolate, spring, Easing} from "remotion";
import {useT} from "./time";
import {C, SANS, fmtNum} from "./theme";
import {Repo} from "./types";
import beats from "../beats.json";

const B = beats.repo;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Go: "#00ADD8",
  Rust: "#dea584", "C++": "#f34b7d", C: "#555555", Java: "#b07219", Shell: "#89e051",
  HTML: "#e34c26", Swift: "#F05138", Kotlin: "#A97BFF", Ruby: "#701516",
};

const TrafficLights: React.FC = () => (
  <div style={{display: "flex", gap: 14}}>
    {[C.red, C.yellow, C.green].map((c) => (
      <div key={c} style={{width: 22, height: 22, borderRadius: 11, background: c}} />
    ))}
  </div>
);

const BookIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.ink2} strokeWidth={2}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
    <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20" />
  </svg>
);

const Star: React.FC<{size: number; filled: boolean; color: string}> = ({size, filled, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"}
    stroke={filled ? color : C.ink2} strokeWidth={2} strokeLinejoin="round">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);

const Cursor: React.FC = () => (
  <svg width={54} height={54} viewBox="0 0 24 24">
    <path d="M4 2l15 11.5-6.5 1L16 21l-3 1.3-3.4-6.6L4 20z" fill="#111" stroke="#fff"
      strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

const FILES = [
  {n: ".github", dir: true}, {n: "docs", dir: true}, {n: "src", dir: true},
  {n: "examples", dir: true}, {n: "README.md", dir: false}, {n: "LICENSE", dir: false},
];

// Simplified, restyled repository page inside a macOS Safari window.
// Not a copy of GitHub's interface: our own layout keeping the main tabs.
export const SafariWindow: React.FC<{repo: Repo; accent: string}> = ({repo, accent}) => {
  const {frame, fps, t} = useT();

  const enter = spring({frame: frame - B.window * fps, fps, config: {damping: 16, mass: 0.9}});
  const stars = interpolate(t, [B.starsFrom, B.starsTo], [(repo.stars ?? 0) * 0.82, repo.stars ?? 0], {
    ...clamp, easing: Easing.out(Easing.cubic),
  });
  const starred = t >= B.cursorClick;
  const starPop = spring({frame: frame - B.cursorClick * fps, fps, config: {damping: 9}});
  const tab = interpolate(t, [B.tabSlide, B.tabSlide + 0.35], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

  // Cursor path: comes in from bottom right, clicks the Star button, drifts off.
  const cx = interpolate(t, [B.window + 0.2, B.cursorClick, B.cursorClick + 1.6], [900, 806, 640], clamp);
  const cy = interpolate(t, [B.window + 0.2, B.cursorClick, B.cursorClick + 1.6], [760, 168, 560], clamp);
  const press = t >= B.cursorClick - 0.04 && t < B.cursorClick + 0.1 ? 0.85 : 1;

  const tabs = [
    {label: "Code", count: null},
    {label: "Issues", count: repo.openIssues},
    {label: "Pull requests", count: null},
    {label: "Actions", count: null},
    {label: "Wiki", count: null},
  ];
  const tabW = [120, 150, 230, 140, 100];
  const underlineX = interpolate(tab, [0, 1], [0, tabW[0]]);
  const underlineW = interpolate(tab, [0, 1], [tabW[0], tabW[1]]);

  return (
    <div style={{
      position: "absolute", left: 60, top: 690, width: 960, height: 780,
      transform: `translateY(${(1 - enter) * 1300}px) rotate(${(1 - enter) * 4}deg)`,
      borderRadius: 26, overflow: "hidden", background: C.window,
      boxShadow: "0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
      fontFamily: SANS, color: C.ink,
    }}>
      {/* Safari toolbar */}
      <div style={{height: 84, background: C.chrome, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 28px", gap: 30}}>
        <TrafficLights />
        <div style={{fontSize: 30, color: C.ink2}}>‹ ›</div>
        <div style={{flex: 1, height: 50, borderRadius: 14, background: "#fff",
          border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 24, color: C.ink2, gap: 10}}>
          <svg width={18} height={22} viewBox="0 0 18 22">
            <rect x={1} y={9} width={16} height={12} rx={3} fill={C.ink2} />
            <path d="M5 9V6a4 4 0 0 1 8 0v3" stroke={C.ink2} strokeWidth={2.4} fill="none" />
          </svg>
          github.com/{repo.owner}/{repo.name}
        </div>
      </div>

      {/* Repo header */}
      <div style={{padding: "30px 36px 0", display: "flex", alignItems: "center", gap: 16}}>
        <div style={{width: 52, height: 52, borderRadius: 26, background: accent, color: "#000",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24}}>
          {repo.owner.slice(0, 2).toUpperCase()}
        </div>
        <BookIcon size={30} />
        <div style={{fontSize: 34, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520}}>
          <span style={{color: C.link}}>{repo.owner}</span>
          <span style={{color: C.ink2}}> / </span>
          <span style={{color: C.link, fontWeight: 700}}>{repo.name}</span>
        </div>
        <div style={{fontSize: 20, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: "4px 14px", color: C.ink2}}>Public</div>
        <div style={{flex: 1}} />
        <div style={{display: "flex", alignItems: "center", gap: 10, fontSize: 26, fontWeight: 600,
          border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 18px",
          background: starred ? "#f5f5f7" : "#fff", transform: `scale(${starred ? 1 + 0.08 * (1 - starPop) : 1})`}}>
          <Star size={28} filled={starred} color="#e3b341" />
          Star <span style={{background: "#e8e8ed", borderRadius: 14, padding: "2px 12px"}}>{fmtNum(stars)}</span>
        </div>
      </div>

      {/* Main tabs */}
      <div style={{position: "relative", display: "flex", padding: "26px 36px 0", fontSize: 26,
        borderBottom: `1px solid ${C.border}`}}>
        {tabs.map((tb, i) => (
          <div key={tb.label} style={{width: tabW[i], paddingBottom: 18, color: i <= 1 ? C.ink : C.ink2,
            fontWeight: i === Math.round(tab) ? 700 : 500, whiteSpace: "nowrap"}}>
            {tb.label}
            {tb.count !== null && (
              <span style={{marginLeft: 8, fontSize: 20, background: "#e8e8ed", borderRadius: 12,
                padding: "2px 10px"}}>{fmtNum(tb.count)}</span>
            )}
          </div>
        ))}
        <div style={{position: "absolute", left: 36 + underlineX, bottom: -2, height: 5,
          width: underlineW - 20, borderRadius: 3, background: accent}} />
      </div>

      {/* Body */}
      <div style={{display: "flex", padding: "28px 36px", gap: 32}}>
        <div style={{flex: 1.35, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden"}}>
          <div style={{background: "#f5f5f7", padding: "14px 20px", fontSize: 22, color: C.ink2,
            borderBottom: `1px solid ${C.border}`}}>
            <span style={{border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 12px",
              background: "#fff", color: C.ink}}>main</span>
          </div>
          {FILES.map((f, i) => {
            const show = spring({frame: frame - (B.window + 0.25 + i * 0.07) * fps, fps,
              config: {damping: 200}});
            return (
              <div key={f.n} style={{display: "flex", alignItems: "center", gap: 14, padding: "15px 20px",
                fontSize: 24, borderBottom: i < FILES.length - 1 ? `1px solid ${C.border}` : "none",
                opacity: show, transform: `translateX(${(1 - show) * 30}px)`}}>
                <span style={{color: f.dir ? "#54aeff" : C.ink2}}>{f.dir ? "▰" : "▤"}</span>
                <span>{f.n}</span>
                <span style={{flex: 1}} />
                <span style={{width: 120, height: 12, borderRadius: 6, background: "#ececf0"}} />
              </div>
            );
          })}
        </div>
        <div style={{flex: 1, fontSize: 24}}>
          <div style={{fontWeight: 700, fontSize: 28, marginBottom: 14}}>About</div>
          <div style={{color: C.ink, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical", overflow: "hidden"}}>
            {repo.description || "Open-source project"}
          </div>
          <div style={{marginTop: 24, display: "flex", flexDirection: "column", gap: 14, color: C.ink2}}>
            {repo.language && (
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <span style={{width: 18, height: 18, borderRadius: 9,
                  background: LANG_COLORS[repo.language] ?? "#8e8e93"}} />
                {repo.language}
              </div>
            )}
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <Star size={24} filled={false} color="#e3b341" /> {fmtNum(stars)} stars
            </div>
            <div>⑂ {fmtNum(repo.forks)} forks</div>
          </div>
        </div>
      </div>

      {/* macOS cursor */}
      <div style={{position: "absolute", left: cx, top: cy, transform: `scale(${press})`,
        opacity: t > B.window + 0.2 ? 1 : 0}}>
        <Cursor />
      </div>
    </div>
  );
};
