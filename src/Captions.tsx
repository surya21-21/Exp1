import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type Caption = {start: number; end: number; text: string};

export const Captions: React.FC<{captions: Caption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const unit = Math.min(width, height) / 100;
  const t = frame / fps;

  const active = captions.find((c) => t >= c.start && t < c.end);
  if (!active) {
    return null;
  }

  const local = frame - Math.round(active.start * fps);
  const pop = spring({frame: local, fps, config: {damping: 200}, durationInFrames: 8});
  const fadeOut = interpolate(t, [active.end - 0.12, active.end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.08,
      }}
    >
      <div
        style={{
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 4.2 * unit,
          color: "#ffffff",
          background: "rgba(8, 10, 30, 0.72)",
          padding: `${1.2 * unit}px ${2.4 * unit}px`,
          borderRadius: 1.6 * unit,
          maxWidth: "86%",
          textAlign: "center",
          opacity: pop * fadeOut,
          transform: `scale(${0.94 + 0.06 * pop})`,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
