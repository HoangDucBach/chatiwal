"use client";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MetadataGroupSchema } from "@/libs/schema";
import { TGroup } from "@/types";
import { Center, Skeleton } from "@chakra-ui/react";
import { decode } from "@msgpack/msgpack";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, ReactNode, useEffect } from "react";
import { useChannelName } from "./useChannelName";
import { useChannel } from "ably/react";
import { AblyChannelManager } from "@/libs/ablyHelpers";

const GroupContext = createContext<{ group: TGroup } | null>(null);

export const GroupProvider = ({ id, children }: { id: string; children: ReactNode }) => {
    const { getGroupData } = useChatiwalClient();
    const { read } = useWalrusClient();
    const { channelName } = useChannelName();
    const { channel } = useChannel({ channelName });
    const queryClient = useQueryClient();

    const { data: group, isLoading } = useQuery({
        queryKey: ["group", id],
        queryFn: async () => {
            const group = await getGroupData(id);

            const metadata_blob_id = group.metadata_blob_id;
            let metadata;

            try {
                if (metadata_blob_id) {
                    const bufferArr = await read([metadata_blob_id]);
                    const metadataStr = decode(bufferArr[0]);
                    metadata = MetadataGroupSchema.parse(metadataStr);
                }
            } catch (error) {
            }
            return {
                id: group.id,
                members: new Set(group.members),
                metadata: metadata,
                createdAt: group.created_at,
            } as TGroup;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        retry: false,
    })

    useEffect(() => {
        channel.subscribe(AblyChannelManager.EVENTS.FLAG_UPDATED, (message) => {
            queryClient.invalidateQueries({
                queryKey: ["group", id],
            });
        });

        return () => {
            channel.unsubscribe(AblyChannelManager.EVENTS.FLAG_UPDATED);
        }
    }, [channel, id, queryClient]);

    if (isLoading) return (
        <Center flex={"4"} w={"full"} h={"full"} px={"4"}>
            <Skeleton w={"full"} h={"full"} rounded={"3xl"} css={{
                "--start-color": "colors.bg.100",
                "--end-color": "colors.bg.200",
            }}
            />
        </Center>
    );

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