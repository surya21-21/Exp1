import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from "remotion";
import {C, SANS, SERIF, fmtMoney} from "./theme";
import {Repo, Section} from "./types";
import {SafariWindow} from "./SafariWindow";
import beats from "../beats.json";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: frame / fps};
};

// Quick slide-in so every scene change reads as a cut on the whoosh.
const Enter: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {t} = useT();
  const k = interpolate(t, [0, 0.18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{opacity: k, transform: `translateX(${(1 - k) * 80}px)`}}>
      {children}
    </AbsoluteFill>
  );
};

const Strike: React.FC<{progress: number; color: string}> = ({progress, color}) => (
  <div style={{position: "absolute", left: -10, top: "52%", height: 10, borderRadius: 5,
    width: `calc(${progress * 100}% + 20px)`, background: color, transform: "rotate(-4deg)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)"}} />
);

// ---------------------------------------------------------------- Hook
export const HookScene: React.FC<{
  section: Section; repos: Repo[]; total: number; accent: string;
}> = ({repos, total, accent}) => {
  const {t, frame, fps} = useT();
  const H = beats.hook;
  const value = interpolate(t, [0, H.counterEnd], [0, total], {...clamp, easing: Easing.out(Easing.cubic)});
  const strike = interpolate(t, [H.strike, H.strike + 0.25], [0, 1], clamp);
  const free = spring({frame: frame - H.free * fps, fps, config: {damping: 10}});
  const step = Math.floor(t / H.montageStep);
  const shown = repos.length ? repos[step % repos.length] : null;
  const montageOn = t < H.free + 0.4 && shown;

  return (
    <Enter>
      <div style={{position: "absolute", top: 640, width: "100%", textAlign: "center", fontFamily: SANS}}>
        <div style={{position: "relative", display: "inline-block"}}>
          <div style={{fontSize: 230, fontWeight: 800, color: C.text, letterSpacing: -6,
            fontVariantNumeric: "tabular-nums"}}>
            {fmtMoney(Math.round(value))}
          </div>
          <Strike progress={strike} color="#ff4d4d" />
        </div>
        <div style={{fontSize: 50, color: C.dim, marginTop: -10}}>per month on paid tools</div>
      </div>

      <div style={{position: "absolute", top: 1080, width: "100%", textAlign: "center",
        transform: `scale(${free})`, opacity: free}}>
        <div style={{display: "inline-block", fontFamily: SANS, fontWeight: 800, fontSize: 150,
          color: "#000", background: accent, borderRadius: 30, padding: "6px 50px",
          transform: "rotate(-3deg)"}}>$0</div>
        <div style={{fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: C.text, marginTop: 24}}>
          with free GitHub repos
        </div>
      </div>

      {montageOn && shown && (
        <div style={{position: "absolute", top: 1120, width: "100%", display: "flex", justifyContent: "center",
          opacity: 1 - free}}>
          <div style={{background: C.window, color: C.ink, borderRadius: 22, padding: "26px 40px",
            fontFamily: SANS, fontSize: 46, fontWeight: 700, boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
            transform: `rotate(${(step % 2 === 0 ? -1 : 1) * 3}deg)`}}>
            <span style={{color: C.ink2, fontWeight: 500}}>{shown.owner} / </span>{shown.name}
          </div>
        </div>
      )}
    </Enter>
  );
};

// ---------------------------------------------------------------- Repo
export const RepoScene: React.FC<{section: Section; count: number; accent: string}> = ({section, count, accent}) => {
  const {t, frame, fps} = useT();
  const R = beats.repo;
  const repo = section.repo!;
  const num = spring({frame: frame - R.number * fps, fps, config: {damping: 11}});
  const card = spring({frame: frame - R.replaces * fps, fps, config: {damping: 14}});
  const strike = interpolate(t, [R.strike, R.strike + 0.22], [0, 1], clamp);
  const stamp = spring({frame: frame - (R.strike + 0.12) * fps, fps, config: {damping: 8}});

  return (
    <Enter>
      <div style={{position: "absolute", left: 70, top: 560, display: "flex", alignItems: "baseline",
        gap: 18, transform: `scale(${num})`, transformOrigin: "left bottom"}}>
        <span style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 120,
          color: accent, lineHeight: 1}}>
          {String(repo.index).padStart(2, "0")}
        </span>
        <span style={{fontFamily: SANS, fontSize: 40, color: C.dim}}>
          / {String(count).padStart(2, "0")}
        </span>
      </div>

      <SafariWindow repo={repo} accent={accent} />

      {repo.replaces && (
        <div style={{position: "absolute", left: 0, right: 0, top: 1500, display: "flex",
          justifyContent: "center", transform: `translateY(${(1 - card) * 300}px)`, opacity: card}}>
          <div style={{position: "relative", display: "flex", alignItems: "center", gap: 22,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 26, padding: "22px 36px", fontFamily: SANS, color: C.text}}>
            <span style={{fontSize: 34, color: C.dim}}>Replaces</span>
            <span style={{fontSize: 42, fontWeight: 700}}>{repo.replaces}</span>
            {repo.price !== null && (
              <span style={{position: "relative", fontSize: 42, fontWeight: 700}}>
                {fmtMoney(repo.price)}/mo
                <Strike progress={strike} color="#ff4d4d" />
              </span>
            )}
            <div style={{position: "absolute", right: -40, top: -46, background: accent, color: "#000",
              fontWeight: 800, fontSize: 40, padding: "6px 22px", borderRadius: 14,
              transform: `scale(${stamp}) rotate(8deg)`, opacity: stamp}}>FREE</div>
          </div>
        </div>
      )}
    </Enter>
  );
};

// ---------------------------------------------------------------- Text
export const TextScene: React.FC<{section: Section; accent: string}> = ({section, accent}) => {
  const {t, frame, fps} = useT();
  const words = section.keywords.length
    ? section.keywords.join(" ")
    : section.text.split(/\s+/).slice(0, 3).join(" ");
  const pop = spring({frame, fps, config: {damping: 9}});
  const line = interpolate(t, [0.25, 0.6], [0, 1], clamp);
  return (
    <Enter>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", paddingTop: 260}}>
        <div style={{position: "relative", transform: `scale(${pop})`, textAlign: "center",
          padding: "0 80px"}}>
          <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 170,
            lineHeight: 1.05, color: accent}}>{words.replace(/[.,!?:]+$/, "")}</div>
          <div style={{margin: "26px auto 0", height: 12, borderRadius: 6, background: C.text,
            width: `${line * 70}%`}} />
        </div>
      </AbsoluteFill>
    </Enter>
  );
};

// ---------------------------------------------------------------- CTA
export const CtaScene: React.FC<{keyword: string; count: number; accent: string}> = ({keyword, count, accent}) => {
  const {t, frame, fps} = useT();
  const k = spring({frame: frame - beats.cta.keyword * fps, fps, config: {damping: 8}});
  const pulse = 1 + 0.04 * Math.sin(t * 7);
  const bounce = Math.abs(Math.sin(t * 5)) * 30;
  return (
    <Enter>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", paddingTop: 220,
        fontFamily: SANS, color: C.text}}>
        <div style={{fontSize: 80, fontWeight: 700}}>Comment</div>
        <div style={{marginTop: 30, fontSize: 210, fontWeight: 800, color: "#000", background: accent,
          borderRadius: 40, padding: "10px 70px", transform: `scale(${k * pulse}) rotate(-2deg)`,
          letterSpacing: -4}}>{keyword}</div>
        {count > 0 && (
          <div style={{marginTop: 50, fontFamily: SERIF, fontStyle: "italic", fontSize: 64, color: C.dim}}>
            for all {count} links
          </div>
        )}
        <div style={{marginTop: 40, fontSize: 90, transform: `translateY(${bounce}px)`}}>↓</div>
      </AbsoluteFill>
    </Enter>
  );
};
