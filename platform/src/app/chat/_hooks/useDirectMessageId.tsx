"use client";

import { createContext, useContext, ReactNode } from "react";

const DirectMessageContext = createContext<{ id: string } | null>(null);

export const DirectMessageProvider = ({ id, children }: { id: string; children: ReactNode }) => {
    return (
        <DirectMessageContext.Provider value={{ id: id }}>
            {children}
        </DirectMessageContext.Provider>
    );
};

export const useDirectMessageId = () => {
    const context = useContext(DirectMessageContext);
    if (!context) {
        throw new Error("useGroup must be used within a GroupProvider");
    }
    return context;
};