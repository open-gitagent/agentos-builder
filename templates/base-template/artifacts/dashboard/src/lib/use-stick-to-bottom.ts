import { useEffect, useRef, type RefObject } from "react";

/**
 * Auto-scrolls a container (or an end-anchor element) to the bottom only when
 * the user is already near the bottom AND has not actively scrolled away. As
 * soon as the user touches the wheel, trackpad, touch surface, page-up/down
 * keys, or drags the scrollbar, sticking is disabled until they manually
 * scroll back near the bottom themselves. This prevents the auto-scroll from
 * fighting the user when they are reading earlier content while a stream is
 * still rendering new lines below.
 *
 * Pass either:
 *   - `containerRef` pointing to the scrollable element (uses scrollTop), or
 *   - `endRef` pointing to a sentinel inside a scrollable parent (uses scrollIntoView).
 *
 * `deps` — values that, when changed, may trigger an auto-scroll (e.g. message list, streaming flag).
 * `threshold` — px from the bottom that still counts as "at the bottom" (default 96).
 */
export function useStickToBottom(opts: {
  containerRef?: RefObject<HTMLElement | null>;
  endRef?: RefObject<HTMLElement | null>;
  deps: unknown[];
  threshold?: number;
  enabled?: boolean;
}) {
  const { containerRef, endRef, deps, threshold = 96, enabled = true } = opts;
  const stickRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const container =
      containerRef?.current ?? endRef?.current?.parentElement ?? null;
    if (!container) return;

    const isNearBottom = () => {
      const gap = container.scrollHeight - container.scrollTop - container.clientHeight;
      return gap <= threshold;
    };

    const onScroll = () => {
      const prev = lastScrollTopRef.current;
      const now = container.scrollTop;
      // If the user scrolled UP, immediately disengage sticking. Only re-engage
      // when they scroll back down to within `threshold` px of the bottom.
      if (now < prev - 2) {
        stickRef.current = false;
      } else if (isNearBottom()) {
        stickRef.current = true;
      }
      lastScrollTopRef.current = now;
    };

    // Any explicit user-input gesture immediately disables sticking. We only
    // re-enable it once the natural scroll handler sees the user back at the
    // bottom of the container.
    const onUserIntent = (e: Event) => {
      if (e.type === "wheel") {
        const we = e as WheelEvent;
        if (we.deltaY < 0) stickRef.current = false;
      } else {
        stickRef.current = false;
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("wheel", onUserIntent, { passive: true });
    container.addEventListener("touchmove", onUserIntent, { passive: true });
    container.addEventListener("keydown", onUserIntent);
    lastScrollTopRef.current = container.scrollTop;
    stickRef.current = isNearBottom();
    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("wheel", onUserIntent);
      container.removeEventListener("touchmove", onUserIntent);
      container.removeEventListener("keydown", onUserIntent);
    };
  }, [containerRef, endRef, threshold]);

  // When deps change, only scroll if the user was at the bottom. Use "auto"
  // (instant) instead of "smooth" so any user scroll-up gesture isn't fighting
  // an in-flight animation.
  useEffect(() => {
    if (!enabled || !stickRef.current) return;
    if (containerRef?.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      lastScrollTopRef.current = containerRef.current.scrollTop;
    } else if (endRef?.current) {
      endRef.current.scrollIntoView({ block: "end" });
      const parent = endRef.current.parentElement;
      if (parent) lastScrollTopRef.current = parent.scrollTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
