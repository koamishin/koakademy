import { Button } from "@/components/ui/button";
import { SiFacebook, SiGithub, SiGoogle, SiX } from "@icons-pack/react-simple-icons";
import { usePage } from "@inertiajs/react";
import { Link2 } from "lucide-react";
import type { ComponentType } from "react";

type SocialAuthProvider = {
    key: string;
    label: string;
    redirect_url: string;
};

const providerIcons: Record<string, ComponentType<{ className?: string }>> = {
    google: SiGoogle,
    facebook: SiFacebook,
    github: SiGithub,
    twitter: SiX,
    linkedin: Link2,
};

export function SocialAuthButtons() {
    const { socialAuthProviders = [] } = usePage<{ socialAuthProviders?: SocialAuthProvider[] }>().props;

    if (socialAuthProviders.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background text-muted-foreground px-2">Or continue with</span>
                </div>
            </div>

            <div className="grid gap-2">
                {socialAuthProviders.map((provider) => {
                    const Icon = providerIcons[provider.key] ?? Link2;

                    return (
                        <Button
                            key={provider.key}
                            type="button"
                            variant="outline"
                            className="h-10 w-full"
                            onClick={() => {
                                window.location.href = provider.redirect_url;
                            }}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            Continue with {provider.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
