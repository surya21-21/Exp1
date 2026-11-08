import React from "react";
import {AbsoluteFill, Sequence, interpolate, random, useCurrentFrame, useVideoConfig, Easing} from "remotion";
import {C, SANS, fmtMoney} from "./theme";
import {ReelProps, Repo} from "./types";
import {ReelCaptions} from "./ReelCaptions";
import {CtaScene, HookScene, RepoScene, TextScene} from "./Scenes";
import beats from "../beats.json";
import {SpeedContext, repoSpeed} from "./time";

const W = 1080;
const H = 1920;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// Dark stage that never stands still: drifting dot grid + moving accent glow.
const Stage: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const gx = (frame * 0.6) % 60;
  const glowX = 540 + Math.sin(frame / 70) * 260;
  const glowY = 900 + Math.cos(frame / 90) * 380;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.bg0} 0%, ${C.bg1} 100%)`}}>
      <AbsoluteFill style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)",
        backgroundSize: "60px 60px", backgroundPosition: `${gx}px ${gx * 0.5}px`,
      }} />
      <div style={{position: "absolute", left: glowX - 450, top: glowY - 450, width: 900, height: 900,
        borderRadius: 450, background: accent, opacity: 0.13, filter: "blur(160px)"}} />
      {Array.from({length: 18}).map((_, i) => {
        const x = random(`px${i}`) * W;
        const y = ((random(`py${i}`) * H) - frame * (0.6 + random(`ps${i}`))) % H;
        return <div key={i} style={{position: "absolute", left: x, top: y < 0 ? y + H : y,
          width: 6, height: 6, borderRadius: 3, background: accent, opacity: 0.35}} />;
      })}
    </AbsoluteFill>
  );
};

// Thin progress bar with one segment per section (keeps the "how long is left" pull).
const Progress: React.FC<{props: ReelProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const total = props.durationInFrames;
  return (
    <div style={{position: "absolute", left: 70, right: 70, top: 200, height: 8, display: "flex", gap: 8}}>
      {props.sections.map((s, i) => {
        const a = s.start * props.fps;
        const b = s.end * props.fps;
        const fill = interpolate(frame, [a, b], [0, 1], clamp);
        return (
          <div key={i} style={{flex: Math.max(0.01, (b - a) / total), height: 8, borderRadius: 4,
            background: "rgba(255,255,255,0.18)", overflow: "hidden"}}>
            <div style={{width: `${fill * 100}%`, height: "100%", background: props.accent}} />
          </div>
        );
      })}
    </div>
  );
};

// Running total of money saved; ticks up on each strike-through.
const Savings: React.FC<{props: ReelProps; repos: {repo: Repo; at: number}[]}> = ({props, repos}) => {
  const frame = useCurrentFrame();
  const t = frame / props.fps;
  if (!repos.length || t < repos[0].at - beats.repo.strike) return null;
  let saved = 0;
  for (const r of repos) {
    saved += (r.repo.price ?? 0) * interpolate(t, [r.at, r.at + 0.4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  }
  if (props.totalMonthly <= 0) return null;
  return (
    <div style={{position: "absolute", right: 70, top: 590, fontFamily: SANS, textAlign: "right"}}>
      <div style={{fontSize: 26, color: C.dim, letterSpacing: 2}}>SAVED / MONTH</div>
      <div style={{fontSize: 64, fontWeight: 800, color: props.accent, fontVariantNumeric: "tabular-nums"}}>
        {fmtMoney(Math.round(saved * 100) / 100)}
      </div>
    </div>
  );
};

export const Reel: React.FC<ReelProps> = (props) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const scale = Math.min(width / W, height / H);
  const repos = props.sections.filter((s) => s.type === "repo" && s.repo).map((s) => s.repo!);
  const strikes = props.sections
    .filter((s) => s.type === "repo" && s.repo)
    .map((s) => ({repo: s.repo!, at: s.start + beats.repo.strike / repoSpeed(s.end - s.start)}));
  // Slow constant push-in so even "still" moments move.
  const drift = 1 + 0.025 * (frame / Math.max(1, props.durationInFrames)) + 0.006 * Math.sin(frame / 45);

  return (
    <AbsoluteFill style={{background: C.bg0, alignItems: "center", justifyContent: "center"}}>
      <div style={{width: W, height: H, position: "relative", overflow: "hidden",
        transform: `scale(${scale})`, flexShrink: 0}}>
        <Stage accent={props.accent} />
        <AbsoluteFill style={{transform: `scale(${drift})`}}>
          {props.sections.map((s, i) => {
            const from = Math.round(s.start * fps);
            const dur = Math.max(1, Math.round(s.end * fps) - from);
            return (
              <Sequence key={i} from={from} durationInFrames={dur} layout="none">
                {s.type === "hook" && (
                  <HookScene section={s} repos={repos} total={props.totalMonthly} accent={props.accent} />
                )}
                {s.type === "repo" && s.repo && (
                  <SpeedContext.Provider value={repoSpeed(s.end - s.start)}>
                    <RepoScene section={s} count={props.repoCount} accent={props.accent} />
                  </SpeedContext.Provider>
                )}
                {s.type === "text" && <TextScene section={s} accent={props.accent} />}
                {s.type === "cta" && (
                  <CtaScene keyword={props.ctaKeyword} count={props.repoCount} accent={props.accent} />
                )}
              </Sequence>
            );
          })}
          <Savings props={props} repos={strikes} />
        </AbsoluteFill>
        <Progress props={props} />
        <ReelCaptions captions={props.captions} accent={props.accent} />
      </div>
    </AbsoluteFill>
  );
};
