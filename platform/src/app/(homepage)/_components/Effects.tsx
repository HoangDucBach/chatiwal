"use client"

import { Box, chakra } from "@chakra-ui/react";

export function Effects() {
    return (
        <chakra.div pos={"absolute"} zIndex={"0"} top={0} left={0} w={"full"} h={"full"} pointerEvents={"none"}>
            <Box
                pos={"absolute"}
                top={0}
                right={0}
                w={"64"}
                h={"64"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(256px)"}
            />
            <Box
                pos={"absolute"}
                bottom={0}
                left={0}
                w={"64"}
                h={"64"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(256px)"}
            />
        </chakra.div>
    );
}