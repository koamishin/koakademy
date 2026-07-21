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
            social: [{ icon: "github", label: "GitHub", href: "https://github.com/yukazakiri/koakademy" }],
            sidebar: [
                { label: "Home", link: "/" },
                {
                    label: "User Guide",
                    items: [{ slug: "user-guide/introduction" }],
                },
                {
                    label: "Enrollment Blueprints",
                    items: [
                        { slug: "enrollment-policies/overview" },
                        { slug: "enrollment-policies/quick-start" },
                        { slug: "enrollment-policies/scopes-inheritance" },
                        { slug: "enrollment-policies/availability-eligibility-documents" },
                        { slug: "enrollment-policies/subjects-classes-tuition" },
                        { slug: "enrollment-policies/approvals-notifications" },
                        { slug: "enrollment-policies/simulation-publication" },
                        { slug: "enrollment-policies/troubleshooting-deployment" },
                    ],
                },
                {
                    label: "Developer Docs",
                    collapsed: true,
                    items: [
                        { slug: "getting-started/introduction" },
                        { slug: "getting-started/installation" },
                        { slug: "getting-started/docker" },
                        { slug: "getting-started/configuration" },
                        { slug: "getting-started/troubleshooting" },
                        { slug: "getting-started/contributing" },
                        { slug: "getting-started/architecture" },
                        { slug: "getting-started/faq" },
                        { slug: "development" },
                        { slug: "development/enrollment-policy-extensions" },
                    ],
                },
                {
                    label: "Developer API",
                    collapsed: true,
                    items: [
                        { slug: "api/api-overview" },
                        { slug: "api/developer-api" },
                        { slug: "api/student-verification-api" },
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
