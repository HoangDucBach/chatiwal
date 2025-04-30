"use client"

import { Box, chakra } from "@chakra-ui/react";

export function Effects() {
    return (
        <chakra.div pos={"absolute"} zIndex={"0"} top={"0"} left={"0"} w={"svw"} h={"svh"} pointerEvents={"none"}>
            <Box
                pos={"absolute"}
                top={"30%"}
                left={"50%"}
                translate={["-50%", "-50%"]}
                w={"64"}
                h={"64"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(256px)"}
            />
        </chakra.div>
    );
}