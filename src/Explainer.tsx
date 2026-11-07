import React from "react";
import {
  AbsoluteFill,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {Caption, Captions} from "./Captions";

export type ExplainerProps = {
  title: string;
  subtitle: string;
  accent: string;
  captions: Caption[];
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

const Stars: React.FC<{count: number}> = ({count}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({length: count}).map((_, i) => {
        const x = random(`x-${i}`) * width;
        const y = random(`y-${i}`) * height;
        const r = 1 + random(`r-${i}`) * 2.5;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame / 22 + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: twinkle,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const PlanetScene: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 100;

  const enter = spring({frame, fps, config: {damping: 12, mass: 0.8}});
  const cx = width / 2;
  const cy = height * 0.45;
  const planetR = 14 * unit * enter;
  const orbitRx = 30 * unit;
  const orbitRy = 9 * unit;
  const angle = frame / 36;
  const moonX = cx + Math.cos(angle) * orbitRx;
  const moonY = cy + Math.sin(angle) * orbitRy;
  const moonInFront = Math.sin(angle) > 0;

  const moon = <circle cx={moonX} cy={moonY} r={3.2 * unit * enter} fill="#e8edf7" />;

  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        <defs>
          <radialGradient id="planet" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#3b1d6e" />
          </radialGradient>
        </defs>
        {!moonInFront && moon}
        <circle cx={cx} cy={cy} r={planetR} fill="url(#planet)" />
        <ellipse
          cx={cx}
          cy={cy}
          rx={orbitRx}
          ry={orbitRy}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={0.5 * unit}
          strokeDasharray={`${1.5 * unit} ${1.5 * unit}`}
        />
        {moonInFront && moon}
      </svg>
    </AbsoluteFill>
  );
};

const Title: React.FC<{title: string; subtitle: string}> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 100;

  const t = spring({frame: frame - 6, fps, config: {damping: 200}});
  const s = spring({frame: frame - 18, fps, config: {damping: 200}});

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: height * 0.07,
      }}
    >
      <div
        style={{
          fontFamily: "sans-serif",
          fontWeight: 800,
          fontSize: 6.5 * unit,
          color: "#ffffff",
          textAlign: "center",
          padding: "0 6%",
          opacity: t,
          transform: `translateY(${(1 - t) * 4 * unit}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "sans-serif",
          fontWeight: 500,
          fontSize: 3.2 * unit,
          color: "rgba(255,255,255,0.7)",
          marginTop: 1.2 * unit,
          opacity: s,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

export const Explainer: React.FC<ExplainerProps> = ({
  title,
  subtitle,
  accent,
  captions,
}) => {
  return (
    <AbsoluteFill
      style={{background: "linear-gradient(180deg, #0b1026 0%, #1b1446 100%)"}}
    >
      <Stars count={140} />
      <PlanetScene accent={accent} />
      <Title title={title} subtitle={subtitle} />
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};
