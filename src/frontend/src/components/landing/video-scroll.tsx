"use client";

import { useEffect, useRef } from "react";

import styles from "./video-scroll.module.css";

export function VideoScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const targetTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let lastTargetTime = 0;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (container && video && video.duration) {
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const containerCenter = rect.top + rect.height / 2;
            const viewportCenter = windowHeight / 2;

            const maxDistance = windowHeight * 0.75;
            const distance = Math.abs(containerCenter - viewportCenter);

            const progress = 1 - Math.min(1, distance / maxDistance);
            const targetTime = Math.pow(progress, 1.2) * video.duration;

            // Only seek if distance moved is greater than 1 video frame
            if (Math.abs(targetTime - lastTargetTime) > 0.033) {
              lastTargetTime = targetTime;
              if ("fastSeek" in video && typeof (video as unknown as { fastSeek: (t: number) => void }).fastSeek === "function") {
                (video as unknown as { fastSeek: (t: number) => void }).fastSeek(targetTime);
              } else {
                video.currentTime = targetTime;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const onLoadedMetadata = () => {
      onScroll();
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.video}
          src="/videos/gpu-video.mp4"
          muted
          playsInline
          preload="auto"
        >
          <source src="/videos/gpu-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
