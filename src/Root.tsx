import React from "react";
import {Composition} from "remotion";
import {Explainer, ExplainerProps} from "./Explainer";
import {Reel} from "./reel/Reel";
import {ReelProps} from "./reel/types";

// The workflow writes build/props.json (duration, size, fps, captions, sections)
// and passes it with --props, so these defaults only matter in Remotion Studio.
export const defaultProps: ExplainerProps = {
  title: "Why is the Moon drifting away?",
  subtitle: "A 60-second science story",
  accent: "#ff6b9d",
  captions: [
    {start: 0.5, end: 3, text: "The Moon is leaving us."},
    {start: 3.2, end: 6, text: "About 3.8 centimetres every year."},
  ],
  durationInFrames: 600,
  fps: 30,
  width: 1280,
  height: 720,
};

const sampleRepo = (index: number, full: string, replaces: string, price: number) => ({
  full, owner: full.split("/")[0], name: full.split("/")[1],
  description: "Sample description. The real one is fetched from GitHub when the workflow runs.",
  stars: 25000, forks: 1500, language: "TypeScript", openIssues: 120, index, replaces, price,
});

export const reelDefaults: ReelProps = {
  accent: "#c6ff3d",
  totalMonthly: 37.99,
  repoCount: 2,
  ctaKeyword: "REPO",
  sections: [
    {type: "hook", start: 0, end: 3, text: "These free repos replaced my paid tools.", keywords: []},
    {type: "repo", start: 3, end: 8, text: "Number one, Remotion.", keywords: ["Remotion"],
      repo: sampleRepo(1, "remotion-dev/remotion", "After Effects", 22.99)},
    {type: "text", start: 8, end: 10.5, text: "Here's my mistake.", keywords: ["mistake"]},
    {type: "repo", start: 10.5, end: 15.5, text: "Number two, HyperFrames.", keywords: ["HyperFrames"],
      repo: sampleRepo(2, "heygen-com/hyperframes", "Motion apps", 15)},
    {type: "cta", start: 15.5, end: 19, text: "Comment REPO.", keywords: ["REPO"], arg: "REPO"},
  ],
  captions: [
    {start: 0.3, end: 2.6, text: "These free repos replaced my paid tools.", words: [
      {text: "These", start: 0.3, end: 0.6}, {text: "free", start: 0.6, end: 0.9, key: true},
      {text: "repos", start: 0.9, end: 1.2, key: true}, {text: "replaced", start: 1.2, end: 1.6}]},
  ],
  durationInFrames: 570,
  fps: 30,
  width: 1080,
  height: 1920,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={reelDefaults.durationInFrames}
        fps={reelDefaults.fps}
        width={reelDefaults.width}
        height={reelDefaults.height}
        defaultProps={reelDefaults}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames,
          fps: props.fps,
          width: props.width,
          height: props.height,
        })}
      />
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={defaultProps.durationInFrames}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={({props}) => ({
          durationInFrames: props.durationInFrames,
          fps: props.fps,
          width: props.width,
          height: props.height,
        })}
      />
    </>
  );
};
