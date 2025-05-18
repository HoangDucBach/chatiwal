"use client"

import { Box, BoxProps } from "@chakra-ui/react";

interface TagProps extends BoxProps { }
export function Tag({ children, ...props }: TagProps) {
    return (
        <Box
            w={"fit"}
            h={"fit"}
            px={"4"}
            outlineColor={"colorPalette.500/25"}
            outlineStyle={"solid"}
            outlineWidth={"4px"}
            borderRadius={"lg"}
            color={"colorPalette.contrast"}
            bg={"colorPalette.solid"}
            fontWeight={"semibold"}
            cursor={"pointer"}
            {...props}
        >
            {children}
        </Box>
    );
}