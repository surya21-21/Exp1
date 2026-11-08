import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import beats from "../beats.json";

// Short repo sections play their beats faster so every beat (window, stars,
// strike) still lands before the next scene. scripts/build_timeline.py uses
// the same formula for the sound-effect cues, so sound and picture stay synced.
export const repoSpeed = (durationSeconds: number) =>
  Math.max(1, (beats.repo.strike + 0.5) / Math.max(0.5, durationSeconds - 0.3));

export const SpeedContext = React.createContext(1);

// Scene time, sped up by the section's speed factor.
export const useT = () => {
  const speed = React.useContext(SpeedContext);
  const raw = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frame = raw * speed;
  return {frame, fps, t: frame / fps};
};
