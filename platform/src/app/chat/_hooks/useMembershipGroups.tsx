import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MembershipGroupsState {
    membershipIds: string[];
    hasMembership: (id: string) => boolean;
    addMembership: (id: string) => void;
    removeMembership: (id: string) => void;
    clearMemberships: () => void;
}

export const useMembershipGroups = create<MembershipGroupsState>()(
    persist(
        (set, get) => ({
            membershipIds: [],

            hasMembership: (id: string) => {
                return get().membershipIds.includes(id);
            },

            addMembership: (id: string) => {
                set((state) => {
                    if (!state.membershipIds.includes(id)) {
                        return {
                            membershipIds: [...state.membershipIds, id],
                        };
                    }
                    return state;
                });
            },

            removeMembership: (id: string) => {
                set((state) => ({
                    membershipIds: state.membershipIds.filter((m) => m !== id),
                }));
            },

            clearMemberships: () => {
                set({ membershipIds: [] });
            },
        }),
        {
            name: 'membership-groups',
            storage: {
                getItem: (name) => {
                    const item = sessionStorage.getItem(name);
                    return item ? JSON.parse(item) : null;
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            }
        }
    )
);