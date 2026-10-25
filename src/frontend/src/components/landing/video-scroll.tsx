"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type ScrollyVideoType from "scrolly-video/dist/ScrollyVideo.js";
import styles from "./video-scroll.module.css";

export function VideoScroll() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let scrollyVideo: ScrollyVideoType | null = null;
    let scrollTrigger: ScrollTrigger | null = null;
    let isMounted = true;
    let lastProgress = -1;

    async function init() {
      if (!videoContainerRef.current || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      // Dynamically import ScrollyVideo for safe client-side execution
      const ScrollyVideoModule = await import("scrolly-video/dist/ScrollyVideo.js");
      const ScrollyVideo = ScrollyVideoModule.default;

      if (!isMounted || !videoContainerRef.current || !sectionRef.current) return;

      // Clean container if any elements were appended
      videoContainerRef.current.innerHTML = "";

      scrollyVideo = new ScrollyVideo({
        scrollyVideoContainer: videoContainerRef.current,
        src: "/videos/gpu-video.mp4",
        trackScroll: false,
        full: false,
        sticky: false,
        cover: false,
        useWebCodecs: true,
        transitionSpeed: 16,
        frameThreshold: 0.01,
        onReady: () => {
          if (scrollTrigger && scrollyVideo) {
            lastProgress = scrollTrigger.progress;
            scrollyVideo.setVideoPercentage(scrollTrigger.progress, { jump: true });
          }
          ScrollTrigger.refresh();
        },
      });

      // Ensure video element plays nicely with autoplay/playsinline policies
      if (scrollyVideo.video) {
        scrollyVideo.video.muted = true;
        scrollyVideo.video.playsInline = true;
        scrollyVideo.video.setAttribute("playsinline", "");
        scrollyVideo.video.setAttribute("muted", "");
        scrollyVideo.video.addEventListener(
          "loadedmetadata",
          () => {
            if (scrollTrigger && scrollyVideo) {
              lastProgress = scrollTrigger.progress;
              scrollyVideo.setVideoPercentage(scrollTrigger.progress, { jump: true });
            }
          },
          { once: true }
        );
      }

      scrollTrigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 0.5,
        onUpdate: (self) => {
          if (scrollyVideo && Math.abs(self.progress - lastProgress) > 0.005) {
            lastProgress = self.progress;
            scrollyVideo.setVideoPercentage(self.progress, { jump: true });
          }
        },
      });
    }

    init();

    return () => {
      isMounted = false;
      if (scrollTrigger) {
        scrollTrigger.kill();
      }
      if (scrollyVideo && typeof scrollyVideo.destroy === "function") {
        scrollyVideo.destroy();
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label="Hardware Architecture Showcase"
    >
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.videoWrapper}>
        <div ref={videoContainerRef} className={styles.videoTarget} />
      </div>
    </section>
  );
}
