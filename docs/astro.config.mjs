import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
    site: "https://koakademy.github.io",
    base: "/koakademy",
    integrations: [
        starlight({
            title: "KoAkademy Docs",
            description: "KoAkademy platform documentation",
            favicon: "/favicon.ico",
            logo: {
                src: "./public/logo.png",
                alt: "KoAkademy",
            },
            head: [
                { tag: "link", attrs: { rel: "icon", href: "/koakademy/favicon.ico", sizes: "any" } },
                { tag: "link", attrs: { rel: "icon", href: "/koakademy/favicon.svg", type: "image/svg+xml" } },
                { tag: "link", attrs: { rel: "icon", href: "/koakademy/favicon-96x96.png", type: "image/png", sizes: "96x96" } },
                { tag: "link", attrs: { rel: "apple-touch-icon", href: "/koakademy/favicon-96x96.png" } },
            ],
            lastUpdated: true,
            customCss: ["./src/styles/custom.css"],
            social: [{ icon: "github", label: "GitHub", href: "https://github.com/koakademy/koakademy" }],
            sidebar: [
                { label: "Home", link: "/" },
                {
                    label: "Getting Started",
                    items: [
                        { slug: "getting-started/introduction" },
                        { slug: "getting-started/installation" },
                        { slug: "getting-started/docker" },
                        { slug: "getting-started/configuration" },
                        { slug: "getting-started/troubleshooting" },
                        { slug: "getting-started/contributing" },
                    ],
                },
                {
                    label: "Development",
                    items: [{ slug: "development" }],
                },
                {
                    label: "API",
                    items: [
                        { slug: "api/api-overview" },
                        { slug: "api/developer-api" },
                        { slug: "api/student-api" },
                        { slug: "api/student-verification-api" },
                    ],
                },
                {
                    label: "Superpowers",
                    collapsed: true,
                    items: [
                        { slug: "superpowers/plans/2026-05-16-feature-toggles-restructure" },
                        { slug: "superpowers/specs/2026-05-16-feature-toggles-restructure-design" },
                    ],
                },
            ],
            expressiveCode: {
                themes: ["github-dark"],
                styleOverrides: {
                    borderRadius: "0.5rem",
                },
            },
        }),
    ],
});
