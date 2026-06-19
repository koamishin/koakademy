import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SiFacebook, SiGithub, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { useForm } from "@inertiajs/react";
import { Info, Link2, Loader2, Save } from "lucide-react";
import type { ComponentType } from "react";

import { submitSystemForm } from "./form-submit";
import SystemManagementLayout from "./layout";
import type { SystemManagementPageProps } from "./types";

interface SocialiteFormData {
    facebook_client_id: string;
    facebook_client_secret: string;
    facebook_enabled: boolean;
    facebook_redirect_uri: string;
    google_client_id: string;
    google_client_secret: string;
    google_enabled: boolean;
    google_redirect_uri: string;
    twitter_client_id: string;
    twitter_client_secret: string;
    twitter_enabled: boolean;
    twitter_redirect_uri: string;
    github_client_id: string;
    github_client_secret: string;
    github_enabled: boolean;
    github_redirect_uri: string;
    linkedin_client_id: string;
    linkedin_client_secret: string;
    linkedin_enabled: boolean;
    linkedin_redirect_uri: string;
}

interface ProviderConfig {
    key: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    idField: keyof SocialiteFormData;
    secretField: keyof SocialiteFormData;
    enabledField: keyof SocialiteFormData;
    redirectField: keyof SocialiteFormData;
    idLabel: string;
    secretLabel: string;
}

const providerConfigs: ProviderConfig[] = [
    {
        key: "google",
        label: "Google",
        icon: SiGoogle,
        idField: "google_client_id",
        secretField: "google_client_secret",
        enabledField: "google_enabled",
        redirectField: "google_redirect_uri",
        idLabel: "Client ID",
        secretLabel: "Client Secret",
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: SiFacebook,
        idField: "facebook_client_id",
        secretField: "facebook_client_secret",
        enabledField: "facebook_enabled",
        redirectField: "facebook_redirect_uri",
        idLabel: "App ID",
        secretLabel: "App Secret",
    },
    {
        key: "github",
        label: "GitHub",
        icon: SiGithub,
        idField: "github_client_id",
        secretField: "github_client_secret",
        enabledField: "github_enabled",
        redirectField: "github_redirect_uri",
        idLabel: "Client ID",
        secretLabel: "Client Secret",
    },
    {
        key: "twitter",
        label: "Twitter / X",
        icon: SiX,
        idField: "twitter_client_id",
        secretField: "twitter_client_secret",
        enabledField: "twitter_enabled",
        redirectField: "twitter_redirect_uri",
        idLabel: "Client ID",
        secretLabel: "Client Secret",
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: Link2,
        idField: "linkedin_client_id",
        secretField: "linkedin_client_secret",
        enabledField: "linkedin_enabled",
        redirectField: "linkedin_redirect_uri",
        idLabel: "Client ID",
        secretLabel: "Client Secret",
    },
];

export default function SystemManagementSocialitePage({ user, socialite_config, access }: SystemManagementPageProps) {
    const socialiteForm = useForm<SocialiteFormData>({
        facebook_client_id: socialite_config?.facebook_client_id || "",
        facebook_client_secret: socialite_config?.facebook_client_secret || "",
        facebook_enabled: Boolean(socialite_config?.facebook_enabled),
        facebook_redirect_uri: socialite_config?.facebook_redirect_uri || "",
        google_client_id: socialite_config?.google_client_id || "",
        google_client_secret: socialite_config?.google_client_secret || "",
        google_enabled: Boolean(socialite_config?.google_enabled),
        google_redirect_uri: socialite_config?.google_redirect_uri || "",
        twitter_client_id: socialite_config?.twitter_client_id || "",
        twitter_client_secret: socialite_config?.twitter_client_secret || "",
        twitter_enabled: Boolean(socialite_config?.twitter_enabled),
        twitter_redirect_uri: socialite_config?.twitter_redirect_uri || "",
        github_client_id: socialite_config?.github_client_id || "",
        github_client_secret: socialite_config?.github_client_secret || "",
        github_enabled: Boolean(socialite_config?.github_enabled),
        github_redirect_uri: socialite_config?.github_redirect_uri || "",
        linkedin_client_id: socialite_config?.linkedin_client_id || "",
        linkedin_client_secret: socialite_config?.linkedin_client_secret || "",
        linkedin_enabled: Boolean(socialite_config?.linkedin_enabled),
        linkedin_redirect_uri: socialite_config?.linkedin_redirect_uri || "",
    });

    const callbackBase = typeof window === "undefined" ? "" : window.location.origin;

    return (
        <SystemManagementLayout
            user={user}
            access={access}
            activeSection="socialite"
            heading="Social Auth"
            description="Configure OAuth providers used for social sign-in flows."
        >
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle>OAuth Providers</CardTitle>
                            <CardDescription>Store provider credentials in one place and sync environment values.</CardDescription>
                        </div>
                        <Button
                            onClick={() =>
                                submitSystemForm({
                                    form: socialiteForm,
                                    routeName: "administrators.system-management.socialite.update",
                                    successMessage: "Social authentication settings updated successfully.",
                                    errorMessage: "Failed to update social authentication settings.",
                                })
                            }
                            disabled={socialiteForm.processing}
                        >
                            {socialiteForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-lg border border-blue-300/60 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                        <div className="flex items-start gap-3 text-sm">
                            <Info className="h-5 w-5 shrink-0 text-blue-600" />
                            <div className="space-y-1">
                                <p className="font-medium text-blue-700 dark:text-blue-300">Callback URL pattern</p>
                                <code className="block rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                                    {callbackBase}/auth/{"{provider}"}/callback
                                </code>
                            </div>
                        </div>
                    </div>

                    {providerConfigs.map((provider, index) => {
                        const Icon = provider.icon;
                        const isConfigured =
                            String(socialiteForm.data[provider.idField]).trim() !== "" &&
                            String(socialiteForm.data[provider.secretField]).trim() !== "";

                        return (
                            <div key={provider.key} className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        <h3 className="font-medium">{provider.label}</h3>
                                        {isConfigured ? <Badge variant="outline">Configured</Badge> : null}
                                    </div>
                                    {isConfigured ? (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm">Enable sign-in</Label>
                                            <Switch
                                                checked={Boolean(socialiteForm.data[provider.enabledField])}
                                                onCheckedChange={(checked) => socialiteForm.setData(provider.enabledField, checked)}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>{provider.idLabel}</Label>
                                        <Input
                                            value={String(socialiteForm.data[provider.idField] || "")}
                                            onChange={(event) => socialiteForm.setData(provider.idField, event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{provider.secretLabel}</Label>
                                        <Input
                                            type="password"
                                            value={String(socialiteForm.data[provider.secretField] || "")}
                                            onChange={(event) => socialiteForm.setData(provider.secretField, event.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Login callback URL</Label>
                                    <Input
                                        value={String(socialiteForm.data[provider.redirectField] || `${callbackBase}/auth/${provider.key}/callback`)}
                                        onChange={(event) => socialiteForm.setData(provider.redirectField, event.target.value)}
                                    />
                                </div>
                                {index < providerConfigs.length - 1 ? <Separator /> : null}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </SystemManagementLayout>
    );
}
