import React from "react";
import {Composition} from "remotion";
import {Explainer, ExplainerProps} from "./Explainer";

// The workflow writes build/props.json (duration, size, fps, captions) and
// passes it with --props, so these defaults only matter in Remotion Studio.
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

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
