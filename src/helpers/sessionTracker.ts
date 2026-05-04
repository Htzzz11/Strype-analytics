import type { useStore } from "@/store/store";
import { Analytics_session_idle_threshold_ms, Analytics_session_tick_ms } from "@/helpers/analyticsConstants";

export function startSessionTracking(store: ReturnType<typeof useStore>): void {
    let lastActivityTime = Date.now();
    let lastTickTime = Date.now();

    store.analyticsSessionStartTime = Date.now();
    store.analyticsActiveSessionTime = 0;

    const onActivity = () => {
        lastActivityTime = Date.now();
    };

    document.addEventListener("mousemove", onActivity, { passive: true });
    document.addEventListener("keydown", onActivity, { passive: true });
    document.addEventListener("click", onActivity, { passive: true });
    document.addEventListener("scroll", onActivity, { passive: true });

    const tick = () => {
        const now = Date.now();
        if (now - lastActivityTime < Analytics_session_idle_threshold_ms) {
            store.analyticsActiveSessionTime += now - lastTickTime;
        }
        lastTickTime = now;
    };

    setInterval(tick, Analytics_session_tick_ms);

    window.addEventListener("beforeunload", () => {
        tick();
        store.analyticsFrameCount = Object.values(store.frameObjects).filter((f) => f.id > 0).length;
        console.log("Session active time:", Math.round(store.analyticsActiveSessionTime / 1000), "seconds");
        console.log("Frame count:", store.analyticsFrameCount);
    });
}
