import { usePage } from "@inertiajs/react";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

interface PresenceMember {
    id: number | string;
}

interface OnlinePresenceContextValue {
    isReady: boolean;
    onlineUserIds: number[];
}

interface SharedPageProps {
    [key: string]: unknown;
    auth?: {
        user?: {
            id: number;
        } | null;
    };
}

const OnlinePresenceContext = createContext<OnlinePresenceContextValue>({
    isReady: false,
    onlineUserIds: [],
});

export function OnlinePresenceProvider({ children }: PropsWithChildren) {
    const { auth } = usePage<SharedPageProps>().props;
    const userId = auth?.user?.id;
    const [isReady, setIsReady] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

    useEffect(() => {
        if (!userId || !window.Echo) {
            setIsReady(false);
            setOnlineUserIds([]);

            return;
        }

        const channel = window.Echo.join("online-users");

        channel
            .here((members: PresenceMember[]) => {
                setOnlineUserIds(uniqueIds(members));
                setIsReady(true);
            })
            .joining((member: PresenceMember) => {
                setOnlineUserIds((current) => uniqueNumbers([...current, Number(member.id)]));
            })
            .leaving((member: PresenceMember) => {
                setOnlineUserIds((current) => current.filter((id) => id !== Number(member.id)));
            })
            .error(() => {
                setIsReady(false);
            });

        return () => {
            window.Echo?.leave("online-users");
            setIsReady(false);
        };
    }, [userId]);

    const value = useMemo(
        () => ({ isReady, onlineUserIds }),
        [isReady, onlineUserIds],
    );

    return <OnlinePresenceContext.Provider value={value}>{children}</OnlinePresenceContext.Provider>;
}

export function useOnlinePresence(): OnlinePresenceContextValue {
    return useContext(OnlinePresenceContext);
}

function uniqueIds(members: PresenceMember[]): number[] {
    return uniqueNumbers(members.map((member) => Number(member.id)));
}

function uniqueNumbers(ids: number[]): number[] {
    return [...new Set(ids.filter(Number.isFinite))];
}
