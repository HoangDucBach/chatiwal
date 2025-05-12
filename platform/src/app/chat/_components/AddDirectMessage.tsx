"use client";

import { HStack, Icon, Input, PopoverDescription, PopoverHeader, VStack } from "@chakra-ui/react";
import { MdAdd } from "react-icons/md";
import { TiUserAdd } from "react-icons/ti";

import { Button, ButtonProps } from "@/components/ui/button";
import { PopoverBody, PopoverContent, PopoverRoot, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useDirectMessages } from "../_hooks/useDirectMessages";
import { useState } from "react";

interface Props extends ButtonProps { }
export function AddDirectMessage(props: Props) {
    const { addDirectChat } = useDirectMessages();
    const [open, setOpen] = useState(false)

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            const input = event.currentTarget;
            const address = input.value.trim();
            if (address) {
                addDirectChat(address);
                input.value = "";
            }

            setOpen(false);
        }
    };

    return (
        <PopoverRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
            <PopoverTrigger asChild>
                <Button p={"1"} colorPalette={"default"}
                    variant={"ghost"} {...props}>
                    <Icon as={MdAdd} />
                </Button>
            </PopoverTrigger>
            <PopoverContent gap={"2"} p="4">
                <PopoverHeader p={"0"}>
                    <HStack w={"full"} h={"fit"} gap={"2"} rounded={"2xl"} bg={"primary"} shadow={"custom.md"} p={"4"}>
                        <Icon size={"lg"} as={TiUserAdd} color={"primary.contrast"} />
                        <VStack gap={"0"} align={"start"}>
                            <PopoverTitle fontWeight={"medium"} color={"primary.contrast"}>
                                Add direct message
                            </PopoverTitle>
                            <PopoverDescription color={"primary.200"}>
                                Enter user address to add.
                            </PopoverDescription>
                        </VStack>
                    </HStack>
                </PopoverHeader>
                <PopoverBody p={"0"}>
                    <VStack align={"start"}>
                        <Input
                            placeholder="Enter user address"
                            variant={"subtle"}
                            color={"fg.900"}
                            bg={"bg.300"}
                            rounded={"lg"}
                            size={"sm"}
                            _placeholder={{
                                color: "fg.900",
                            }}
                            onKeyDown={handleKeyDown}
                        />
                    </VStack>
                </PopoverBody>
            </PopoverContent>
        </PopoverRoot>
    )
}