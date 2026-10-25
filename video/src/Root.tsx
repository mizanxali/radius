import { Composition } from "remotion";
import { Launch } from "./Launch";

export const RemotionRoot = () => (
  <Composition id="Launch" component={Launch} durationInFrames={8172} fps={60} width={1920} height={1080} />
);
