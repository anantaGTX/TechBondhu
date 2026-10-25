export interface ScrollyVideoOptions {
  src: string;
  scrollyVideoContainer: string | HTMLElement;
  cover?: boolean;
  sticky?: boolean;
  full?: boolean;
  trackScroll?: boolean;
  lockScroll?: boolean;
  transitionSpeed?: number;
  frameThreshold?: number;
  useWebCodecs?: boolean;
  debug?: boolean;
  onReady?: () => void;
  onChange?: (percentage: number) => void;
}

export interface ScrollyVideoRef {
  setVideoPercentage: (
    percentage: number,
    options?: {
      jump?: boolean;
      transitionSpeed?: number;
      easing?: (progress: number) => number;
    }
  ) => void;
}

export interface ScrollyVideoProps {
  src: string;
  scrollyVideoContainer?: string | HTMLElement;
  transitionSpeed?: number;
  frameThreshold?: number;
  cover?: boolean;
  sticky?: boolean;
  full?: boolean;
  trackScroll?: boolean;
  lockScroll?: boolean;
  useWebCodecs?: boolean;
  videoPercentage?: number;
  debug?: boolean;
  onReady?: () => void;
  onChange?: (percentage: number) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "scrolly-video": unknown;
    }
  }
}
