"use client"

import { Text, Field, Icon, Input, TagLabel, Textarea, VStack, Wrap, SwitchRoot, SwitchLabel, useDisclosure, TagRoot, TagCloseTrigger, Heading, SwitchControl, SwitchHiddenInput } from "@chakra-ui/react";
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { MdAdd } from "react-icons/md";

import { Button, ButtonProps } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useSupabase } from "@/hooks/useSupabase";
import { type MetadataGroup, MetadataGroupSchema } from "@/libs/schema";
import { useState } from "react";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { DialogBackdrop, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import { Transaction } from "@mysten/sui/transactions";

interface MintGroupFormData {
    name?: string;
    description?: string;
    tags?: string[];
}

interface Props extends ButtonProps {
    onSuccess?: (groupId: string) => void;
    onError?: (error: any) => void;
}
export function MintGroupButton({ onSuccess, onError, ...props }: Props) {
    const [isMetadataEnabled, setIsMetadataEnabled] = useState(false);

    const { onClose, onOpen, setOpen, open } = useDisclosure()
    const { mintGroupAndTransfer, client } = useChatiwalClient();
    const { addGroupMembership } = useSupabase();
    const { store, storeReturnTransaction } = useWalrusClient();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
    const currentAccount = useCurrentAccount();
    const queryClient = useQueryClient();

    const { mutate: mint, isPending } = useMutation({
        mutationKey: ["groups::mint"],
        mutationFn: async ({ blobId, metatadataTx }: { blobId?: string, metatadataTx?: Transaction }) => {
            if (!currentAccount) throw new Error("Not connected");

            const tx = await mintGroupAndTransfer(blobId, { tx: metatadataTx });

            const { digest } = await signAndExecuteTransaction({
                transaction: tx,
            })
            const { events } = await suiClient.waitForTransaction({
                digest,
                options: {
                    showEvents: true,
                }
            })

            const groupMintedEventType = `${client.getPackageConfig().chatiwalId}::events::GroupMinted`;
            const groupMintedEvent = events?.find(event => event.type === groupMintedEventType);

            if (!groupMintedEvent || !groupMintedEvent.parsedJson) throw new Error("GroupMinted event not found");

            const newGroupData = groupMintedEvent.parsedJson as { id: string };
            onSuccess?.(newGroupData.id);
            await addGroupMembership(currentAccount?.address, newGroupData.id);

            return newGroupData.id;
        },
        onSuccess: async (groupId: string) => {
            toaster.success({
                title: "Group created",
                description: "Group created successfully",
            });
            queryClient.invalidateQueries({
                queryKey: ["groups::memberships"],
            })
            onClose();
        },
        onError: (error) => {
            onError?.(error);
            toaster.error({
                title: "Error creating group",
                description: error.message,
            })

        }

    })

    const {
        handleSubmit,
        control,
        setValue, // Lấy setValue
        formState: { errors, isSubmitting },
    } = useForm<MintGroupFormData>({
        resolver: zodResolver(MetadataGroupSchema),
        defaultValues: {
            name: "",
            description: "",
            tags: [],
        }
    });

    const onSubmit: SubmitHandler<MintGroupFormData> = async (data) => {
        let metadataBlobId: string | undefined = undefined;

        if (isMetadataEnabled) {
            const metadata: MetadataGroup = {
                name: data.name,
                description: data.description,
                tags: data.tags,
            }

            const { blobId, transaction } = await storeReturnTransaction(metadata);

            mint({ blobId, metatadataTx: transaction });
        }

    };

    const handleMintGroupWithoutMetadata = () => {
        mint({});
    }

    const handleMetadataToggle = (event: any) => {
        const isEnabled = event.checked;
        setIsMetadataEnabled(isEnabled);
    };


    return (
        <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)} placement={"center"}>
            <DialogTrigger asChild>
                <Button
                    p={"1"}
                    colorPalette={"default"}
                    variant={"ghost"}
                    disabled={!currentAccount || isPending}
                    {...props}
                >
                    <Icon size={"md"} as={MdAdd} />
                </Button>
            </DialogTrigger>
            <DialogBackdrop />
            <DialogContent>
                <DialogHeader flexDirection={"row"} justifyContent={"space-between"} alignItems={"start"}>
                    <Heading as={"h6"} size={"lg"}>Mint New Group</Heading>
                    <SwitchRoot
                        id='enable-metadata-switch'
                        checked={isMetadataEnabled}
                        onCheckedChange={handleMetadataToggle}
                        colorPalette="primary"
                    >
                        <SwitchHiddenInput />
                        <SwitchControl />
                        <SwitchLabel>
                            Enable metadata
                        </SwitchLabel>
                    </SwitchRoot>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody>
                        <VStack gap={3} align="stretch">
                            {isMetadataEnabled && (
                                <VStack gap={3} align="stretch">
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field.Root invalid={!!fieldState.error}>
                                                <Field.Label fontSize="sm">
                                                    Group Name
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <Input
                                                    variant={"subtle"}
                                                    bg={"bg.300"}
                                                    rounded={"lg"}

                                                    _placeholder={{ color: "fg.700" }}
                                                    size="sm"
                                                    placeholder="Enter group name"
                                                    {...field}
                                                />
                                                {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                            </Field.Root>
                                        )}
                                    />

                                    <Controller
                                        name="description"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Field.Root invalid={!!fieldState.error}>
                                                <Field.Label fontSize="sm">Description</Field.Label>
                                                <Textarea
                                                    size="sm"
                                                    resize={"none"}
                                                    lineHeight={"taller"}
                                                    variant={"subtle"}
                                                    bg={"bg.300"}
                                                    rounded={"lg"}
                                                    _placeholder={{ color: "fg.700" }}
                                                    placeholder="Enter group description"
                                                    {...field}
                                                />
                                                {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                            </Field.Root>
                                        )}
                                    />

                                    <Controller
                                        name="tags"
                                        control={control}
                                        render={({ field, fieldState }) => {
                                            const [inputValue, setInputValue] = useState('');
                                            const currentTags = field.value || [];
                                            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value);
                                            const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                                                if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
                                                    e.preventDefault();
                                                    const newTag = inputValue.trim();
                                                    if (!currentTags.includes(newTag)) {
                                                        field.onChange([...currentTags, newTag]);
                                                    }
                                                    setInputValue('');
                                                } else if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            };
                                            const removeTag = (tagToRemove: string) => field.onChange(currentTags.filter(tag => tag !== tagToRemove));

                                            return (
                                                <Field.Root invalid={!!fieldState.error}>
                                                    <Field.Label fontSize="sm">Tags</Field.Label>
                                                    <Wrap gap={2} p={2}>
                                                        {currentTags.map((tag) => (
                                                            <TagRoot size="sm" key={tag} borderRadius="full" variant="solid" colorScheme="blue"> {/* Smaller tag */}
                                                                <TagLabel>{tag}</TagLabel>
                                                                <TagCloseTrigger onClick={() => removeTag(tag)} />
                                                            </TagRoot>
                                                        ))}
                                                        <Input
                                                            bg={"bg.300"}
                                                            rounded={"lg"}
                                                            _placeholder={{ color: "fg.700" }}
                                                            placeholder={currentTags.length === 0 ? "Add tags..." : ""}
                                                            value={inputValue}
                                                            onChange={handleInputChange}
                                                            onKeyDown={handleInputKeyDown}
                                                            size="sm"
                                                            flexGrow={1}
                                                            minWidth="100px"
                                                        />
                                                    </Wrap>
                                                    {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                                </Field.Root>
                                            );
                                        }}
                                    />
                                </VStack>
                            )}
                        </VStack>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type={isMetadataEnabled ? "submit" : "button"}
                            onClick={isMetadataEnabled ? undefined : handleMintGroupWithoutMetadata}
                            colorPalette="primary"
                            loading={isPending || isSubmitting}
                            loadingText="Minting..."
                            disabled={isPending || !currentAccount}
                        >
                            Mint Group
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogRoot>
    )
}