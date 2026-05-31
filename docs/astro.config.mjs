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
                    label: "Student Portal",
                    collapsed: true,
                    items: [
                        { label: "Dashboard", slug: "student-management/dashboard" },
                        { label: "My Classes", slug: "student-management/my-classes" },
                        { label: "My Schedule", slug: "student-management/schedule" },
                        { label: "Tuition & Payments", slug: "student-management/tuition" },
                        { label: "Profile", slug: "student-management/profile" },
                        { label: "Account Security", slug: "student-management/account-security" },
                        { label: "Digital ID Card", slug: "student-management/digital-id-card" },
                        { label: "Announcements", slug: "student-management/announcements" },
                        { label: "Notifications", slug: "student-management/notifications" },
                        { label: "Help & Support", slug: "student-management/help-support" },
                        { label: "Global Search", slug: "student-management/global-search" },
                        { label: "Settings", slug: "student-management/settings" },
                    ],
                },
                {
                    label: "Faculty Portal",
                    collapsed: true,
                    items: [
                        { label: "Dashboard", slug: "faculty-portal/dashboard" },
                        { label: "My Classes", slug: "faculty-portal/my-classes" },
                        { label: "Managing Students", slug: "faculty-portal/managing-students" },
                        { label: "Recording Grades", slug: "faculty-portal/grades" },
                        { label: "Taking Attendance", slug: "faculty-portal/attendance" },
                        { label: "Class Posts", slug: "faculty-portal/class-posts" },
                        { label: "Action Center", slug: "faculty-portal/action-center" },
                        { label: "My Schedule", slug: "faculty-portal/schedule" },
                        { label: "Searching", slug: "faculty-portal/search" },
                        { label: "Class Settings", slug: "faculty-portal/class-settings" },
                        { label: "Profile", slug: "faculty-portal/profile" },
                        { label: "Account Security", slug: "faculty-portal/account-security" },
                        { label: "Digital ID Card", slug: "faculty-portal/digital-id-card" },
                        { label: "Announcements", slug: "faculty-portal/announcements" },
                        { label: "Notifications", slug: "faculty-portal/notifications" },
                        { label: "Help & Support", slug: "faculty-portal/help-support" },
                        { label: "Settings", slug: "faculty-portal/settings" },
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
