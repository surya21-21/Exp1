import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from "remotion";
import {C, SANS, SERIF} from "./theme";
import {CaptionLine, Word} from "./types";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// Word-by-word captions in the top band. Each word appears as it is spoken;
// keywords switch to the accent colour + italic serif and pop 1.7x -> 1x.
export const ReelCaptions: React.FC<{captions: CaptionLine[]; accent: string}> = ({captions, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  let idx = -1;
  for (let i = 0; i < captions.length; i++) {
    if (captions[i].start - 0.05 <= t) idx = i;
  }
  if (idx < 0) return null;
  const line = captions[idx];
  const next = captions[idx + 1];
  if (t > line.end + 0.6 && (!next || t < next.start - 0.05)) return null;

  const words: Word[] = line.words ?? [{text: line.text, start: line.start, end: line.end}];

  return (
    <div style={{position: "absolute", left: 70, right: 70, top: 250, height: 330,
      display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center",
      columnGap: 22, rowGap: 6, textAlign: "center"}}>
      {words.map((w, i) => {
        const appear = interpolate(t, [w.start - 0.04, w.start + 0.08], [0, 1], clamp);
        if (appear <= 0) return null;
        const pop = w.key
          ? interpolate(t, [w.start, w.start + 0.35], [1.7, 1], {...clamp, easing: Easing.out(Easing.back(2))})
          : interpolate(appear, [0, 1], [0.85, 1]);
        return (
          <span key={i} style={{
            display: "inline-block",
            fontFamily: w.key ? SERIF : SANS,
            fontStyle: w.key ? "italic" : "normal",
            fontWeight: w.key ? 700 : 800,
            fontSize: w.key ? 88 : 76,
            lineHeight: 1.12,
            color: w.key ? accent : C.text,
            opacity: appear,
            transform: `scale(${pop}) translateY(${(1 - appear) * 14}px)`,
            textShadow: "0 6px 24px rgba(0,0,0,0.6)",
          }}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
