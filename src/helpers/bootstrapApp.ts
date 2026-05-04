import type { Pinia } from "pinia";
import { settingsStore, useStore } from "@/store/store";
import { startSessionTracking } from "@/helpers/sessionTracker";

export async function bootstrapApp(pinia: Pinia): Promise<void> {
    const store = useStore(pinia);
    store.initAnalyticsUserId();
    store.initAnalyticsSession();
    store.initAnalyticsPlatform();
    startSessionTracking(store);
    await store.initAnalyticsCountry();
    store.captureFrameTypes();

    const settings = settingsStore(pinia);
    settings.$subscribe((_mutation, state) => {
        if (typeof state.locale === "string" && state.locale.length > 0) {
            store.trackAnalyticsLocaleChange(state.locale);
        }
    });
}
