"use client";

import { TGroup } from "@/types";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, ReactNode } from "react";

const GroupContext = createContext<{ group: TGroup } | null>(null);

export const GroupProvider = ({ id, children }: { id: string; children: ReactNode }) => {
    const suiClient = useSuiClient();
    const { data: group } = useQuery({
        queryKey: ["group", id],
        queryFn: async () => {
            const res = await suiClient.getObject({
                id,
                options: {
                    showContent: true,
                }
            });

            console.log("res", res);
            if (res.error) {
                console.error("Error fetching group", res.error);
                return null;
            }

            if (res.data?.content?.dataType !== "moveObject") {
                console.error("Error fetching group", "Invalid group");
                return null;
            }

            const group = res.data?.content.fields as any;

            return {
                id: res.data?.objectId,
                members: new Set(group.member.fields.contents),
                owner: group.owner,
            } as TGroup;

        },
        enabled: !!id,
    })

    if (!group) return null;

    return (
        <GroupContext.Provider value={{ group: group }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroup = () => {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error("useGroup must be used within a GroupProvider");
    }
    return context;
};