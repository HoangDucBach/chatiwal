import { createClient } from '@supabase/supabase-js'
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

interface SupabaseActionsProps {
    getGroupMemberships: (user: string) => Promise<string[]>;
    addGroupMembership: (user: string, groupId: string) => Promise<void>;
    getSuperMessages: (groupId: string) => Promise<string[]>;
    addSuperMessage: (groupId: string, superMessageId: string) => Promise<void>;
}

export function useSupabase(): SupabaseActionsProps {
    const supabase = useMemo(() => {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }, []);

    const actions = useMemo(() => {
        return {
            addGroupMembership: async (user: string, groupId: string) => {
                const { error: insertError } = await supabase
                    .from("user_group_memberships")
                    .upsert(
                        { user_address: user, group_id: groupId },
                        { onConflict: 'user_address,group_id', ignoreDuplicates: true }
                    )
                    .select();

                if (insertError) {
                    console.error("Error inserting group membership:", insertError);
                    throw insertError;
                }
            },

            getGroupMemberships: async (user: string) => {
                const { data: memberships } = await supabase
                    .from("user_group_memberships")
                    .select("group_id")
                    .eq("user_address", user);

                if (!memberships) {
                    throw new Error("Failed to fetch user group memberships");
                }

                return memberships.map((membership) => membership.group_id);
            },

            addSuperMessage: async (groupId: string, superMessageId: string) => {
                const { error: insertError } = await supabase
                    .from("group_super_messages")
                    .upsert(
                        { group_id: groupId, super_message_id: superMessageId },
                        { onConflict: 'group_id,super_message_id', ignoreDuplicates: true }
                    )
                    .select();

                if (insertError) {
                    throw new Error("Failed to insert super message id: ", insertError);
                    throw insertError;
                }
            },
            
            getSuperMessages: async (groupId: string) => {
                const { data: superMessages } = await supabase
                    .from("group_super_messages")
                    .select("super_message_id")
                    .eq("group_id", groupId);

                if (!superMessages) {
                    throw new Error("Failed to fetch super message id for group: ");
                }

                return superMessages.map((superMessage) => superMessage.super_message_id);
            },
        };
    }, [supabase]);

    return actions;
}