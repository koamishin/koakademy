import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher?: typeof Pusher;
        Echo?: Echo<"pusher">;
        pusherConfig?: {
            key?: string;
            cluster?: string;
            host?: string;
            port?: number;
            scheme?: string;
        };
    }
}

const runtimeConfig = window.pusherConfig;
const pusherKey = runtimeConfig?.key || import.meta.env.VITE_PUSHER_APP_KEY;

if (typeof pusherKey === "string" && pusherKey.length > 0) {
    const scheme = runtimeConfig?.scheme || import.meta.env.VITE_PUSHER_SCHEME || "https";
    const port = Number(runtimeConfig?.port || import.meta.env.VITE_PUSHER_PORT || (scheme === "https" ? 443 : 80));

    window.Pusher = Pusher;

    window.Echo = new Echo({
        broadcaster: "pusher",
        key: pusherKey,
        cluster: runtimeConfig?.cluster || import.meta.env.VITE_PUSHER_APP_CLUSTER,
        wsHost: runtimeConfig?.host || import.meta.env.VITE_PUSHER_HOST || undefined,
        wsPort: port,
        wssPort: port,
        forceTLS: scheme === "https",
        enabledTransports: ["ws", "wss"],
    });
}

export default window.Echo;
