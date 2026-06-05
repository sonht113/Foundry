import { useCallback, useEffect, useRef, useState } from "react";

interface HorizontalScrollBarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function HorizontalScrollBar({ containerRef }: HorizontalScrollBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);

  const updateThumb = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const { scrollWidth, clientWidth, scrollLeft } = container;
    if (scrollWidth <= clientWidth) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const trackWidth = track.clientWidth;
    const thumbW = Math.max((clientWidth / scrollWidth) * trackWidth, 40);
    setThumbWidth(thumbW);

    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = trackWidth - thumbW;
    const ratio = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    setThumbLeft(ratio * maxThumbLeft);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateThumb();

    const ro = new ResizeObserver(updateThumb);
    ro.observe(container);

    container.addEventListener("scroll", updateThumb, { passive: true });

    return () => {
      ro.disconnect();
      container.removeEventListener("scroll", updateThumb);
    };
  }, [containerRef, updateThumb]);

  function handleTrackClick(e: React.MouseEvent) {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / track.clientWidth;
    container.scrollLeft = ratio * (container.scrollWidth - container.clientWidth);
  }

  function handleThumbPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startScrollLeft = container.scrollLeft;

    function onPointerMove(ev: PointerEvent) {
      if (!track || !container) return;

      const dx = ev.clientX - startX;
      const maxThumbLeft = track.clientWidth - thumbWidth;
      const scrollRatio = dx / (maxThumbLeft || 1);
      container.scrollLeft =
        startScrollLeft + scrollRatio * (container.scrollWidth - container.clientWidth);
    }

    function onPointerUp() {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      track?.removeEventListener("pointermove", onPointerMove);
      track?.removeEventListener("pointerup", onPointerUp);
    }

    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
  }

  if (!visible) return null;

  return (
    <div
      ref={trackRef}
      className="mx-4 h-2 cursor-pointer rounded-full bg-zinc-200 dark:bg-zinc-800"
      onClick={handleTrackClick}
    >
      <div
        className="h-full rounded-full bg-zinc-400 transition-colors hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-500"
        style={{ width: thumbWidth, transform: `translateX(${thumbLeft}px)` }}
        onPointerDown={handleThumbPointerDown}
      />
    </div>
  );
}
