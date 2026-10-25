declare module "scrolly-video/dist/ScrollyVideo.js" {
  import type { ScrollyVideoOptions } from "./scrolly-video";

  export default class ScrollyVideo {
    constructor(options: ScrollyVideoOptions);
    container: HTMLElement;
    src: string;
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement | null;
    videoPercentage: number;
    setVideoPercentage(
      percentage: number,
      options?: {
        jump?: boolean;
        transitionSpeed?: number;
        easing?: (progress: number) => number;
      }
    ): void;
    destroy(): void;
  }
}

declare module "scrolly-video/dist/ScrollyVideo.esm.jsx" {
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  import type { ScrollyVideoProps, ScrollyVideoRef } from "./scrolly-video";

  const ScrollyVideoComponent: ForwardRefExoticComponent<
    ScrollyVideoProps & RefAttributes<ScrollyVideoRef>
  >;
  export default ScrollyVideoComponent;
}
