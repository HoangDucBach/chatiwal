"use client"

import { Box, chakra } from "@chakra-ui/react";

export function Effects() {
    return (
        <chakra.div pos={"fixed"} w={"svw"} h={"svh"} zIndex={"-1"} pointerEvents={"none"}>
            <Box
                pos={"absolute"}
                top={"25%"}
                left={"50%"}
                translate={["-50%", "-50%"]}
                w={"72"}
                h={"72"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(16px)"}
            />
            <Box
                pos={"absolute"}
                top={"50%"}
                left={"15%"}
                translate={["-50%", "-50%"]}
                w={"32"}
                h={"32"}
                bg={"primary.700"}
                borderRadius={"full"}
                filter={"blur(64px)"}
            />
            <Box
                pos={"absolute"}
                top={"15%"}
                left={"50%"}
                translate={["-50%", "-50%"]}
                w={"30%"}
                h={"30%"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(256px)"}
            />
        </chakra.div>
    );
}