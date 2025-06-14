"use client";

import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { chakra } from "@chakra-ui/react";
import {
    useTransform,
    useSpring,
    motion,
    useScroll,
} from "framer-motion";

const MotionDiv = motion(chakra.div);

export const SmoothScrollLayout = ({ children }: React.PropsWithChildren) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pageHeight, setPageHeight] = useState(0);

    const resizePageHeight = useCallback((entries: any) => {
        for (let entry of entries) {
            setPageHeight(entry.contentRect.height);
        }
    }, []);

    useLayoutEffect(() => {
        const resizeObserver = new ResizeObserver(resizePageHeight);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, [resizePageHeight]);

    const { scrollY } = useScroll(); // ⛳ track scroll from window
    const transform = useTransform(scrollY, [0, pageHeight], [0, -pageHeight]);
    const spring = useSpring(transform, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
    });

    return (
        <>
            {/* fake scrollable div */}
            <div style={{ height: pageHeight }} />

            {/* fixed content wrapper */}
            <MotionDiv
                ref={containerRef}
                style={{
                    y: spring,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    willChange: "transform",
                }}
            >
                {children}
            </MotionDiv>
        </>
    );
};