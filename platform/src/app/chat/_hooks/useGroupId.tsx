"use client";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MetadataGroupSchema } from "@/libs/schema";
import { TGroup } from "@/types";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, ReactNode } from "react";

const GroupContext = createContext<{ group: TGroup } | null>(null);

export const GroupProvider = ({ id, children }: { id: string; children: ReactNode }) => {
    const suiClient = useSuiClient();
    const { getGroupData } = useChatiwalClient();
    const { read } = useWalrusClient();

    const { data: group } = useQuery({
        queryKey: ["group", id],
        queryFn: async () => {
            const group = await getGroupData(id);

            const metadata_blob_id = group.metadata_blob_id;
            let metadata;

            if (metadata_blob_id) {
                const bufferArr = await read([metadata_blob_id]);
                const metadataStr = new TextDecoder().decode(bufferArr[0]);
                metadata = MetadataGroupSchema.parse(JSON.parse(metadataStr));
            }

            return {
                id: group.id,
                members: new Set(group.members),
                metadata: metadata,
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