"use client";

import { ButtonProps, Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import { DialogBody, DialogFooter, DialogHeader, DialogRoot, DialogTrigger, DialogContent, DialogCloseTrigger, DialogBackdrop } from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { FaSuperpowers } from "react-icons/fa";

import {
    Input,
    NumberInput,
    Text,
    Stack,
    useDisclosure,
    Field,
    createListCollection,
    SelectHiddenSelect,
    SelectControl,
    Icon,
    StackProps,
    VStack,
    HStack,
    Textarea,
    TextareaProps,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useEffect, useRef } from "react";
import { useGroup } from "../_hooks/useGroupId";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";
import { TMessageBase } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MessageBase, SuperMessageCompound, SuperMessageFeeBased, SuperMessageLimitedRead, SuperMessageNoPolicy, SuperMessageTimeLock } from "@/sdk";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSealClient } from "@/hooks/useSealClient";
import MessageInput from "./MessageInput";

type SuperMessageType = 'time_lock' | 'limited_read' | 'fee_based' | 'compound' | 'no_policy';
type MintParams = {
    type: SuperMessageType;
    groupId: string;
    metadataBlobId: string;
    timeFrom?: bigint;
    timeTo?: bigint;
    maxReads?: bigint;
    fee?: bigint;
    recipient?: string;
    coinType?: string;
}

interface FormValues {
    messageType: SuperMessageType;
    groupId: string;
    timeFrom: number;
    timeTo: number;
    maxReads: number;
    fee: number;
    recipient: string;
    coinType: string;
}

interface Props extends ButtonProps { }
interface FormValues {
    content: string | Uint8Array;
    timeFrom: number;
    timeTo: number;
    maxReads: number;
    fee: number;
    recipient: string;
    coinType: string;
}


interface ComposerInputProps extends StackProps {
    messageInputProps: {
        channelName: string;
        onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
    };
    onMessageMinted?: (message: any) => void;
}

export function ComposerInput({ messageInputProps, ...props }: ComposerInputProps) {
    const { channelName, onMessageSend } = messageInputProps;
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const { onMessageMinted } = props;
    const currentAccount = useCurrentAccount();
    const { group } = useGroup(); // Assuming group ID comes from here
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const {
        mint_super_message_time_lock_and_transfer,
        mint_super_message_no_policy_and_transfer,
        mint_super_message_fee_based_and_transfer,
        mint_super_message_limited_read_and_transfer,
        mint_super_message_compound_and_transfer,
    } = useChatiwalClient()
    const { encryptMessage } = useSealClient();
    const { storeMessage } = useWalrusClient();
    const { mutate: mintSuperMessage, isPending, isError, error, reset: resetMutation } = useMutation({
        mutationFn: async (params: MintParams) => {
            console.log("Mutation function called with:", params);
            if (!group?.id) throw new Error("Group ID is not available");

            let tx;
            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo) throw new Error("Missing time parameters for Time Lock");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Time Lock");
                    tx = await mint_super_message_time_lock_and_transfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
                    break
                case 'limited_read':
                    if (!params.maxReads) throw new Error("Missing maxReads for Limited Read");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Limited Read");
                    tx = await mint_super_message_limited_read_and_transfer(group.id, params.metadataBlobId, params.maxReads);
                    break
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient || !params.coinType) throw new Error("Missing parameters for Fee Based");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Fee Based");
                    tx = await mint_super_message_fee_based_and_transfer(group.id, params.metadataBlobId, BigInt(params.fee), params.recipient, params.coinType); // Ensure fee is BigInt
                    break
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads || params.fee === undefined || !params.recipient || !params.coinType)
                        throw new Error("Missing parameters for Compound");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Compound");
                    tx = await mint_super_message_compound_and_transfer(
                        group.id,
                        params.metadataBlobId,
                        params.timeFrom,
                        params.timeTo,
                        params.maxReads,
                        BigInt(params.fee), // Ensure fee is BigInt
                        params.recipient,
                        params.coinType
                    );
                    break
                case 'no_policy':
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for No Policy"); // Assuming it's still needed
                    // If 'no_policy' doesn't actually use metadataBlobId, adjust this call:
                    tx = await mint_super_message_no_policy_and_transfer(group.id, params.metadataBlobId /* or potentially remove if not needed */);
                    break
            }

            if (!tx) {
                throw new Error("Transaction is undefined");
            }

            let { digest } = await signAndExecuteTransaction({
                transaction: tx,
            });

            await suiClient.waitForTransaction({
                digest,
            });
        },
        onSuccess: (data, variables) => {
            console.log('Mutation successful:', data);
            // Invalidate queries to refetch message list, etc.
            queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });
            // Add other relevant query keys if needed

            toaster.success({
                title: "Success",
                description: "Super message minted successfully",
                duration: 5000,
            });

            // Call the callback to update UI optimistically or with returned data
            if (onMessageMinted) {
                // You might need to construct the message data structure expected by your UI
                // based on 'data' returned from the mutation and 'variables'
                // onMessageMinted({ ...variables, ...data, /* potentially add text content */ });
            }

            resetMutation(); // Reset mutation state (isError, error)
            resetForm(); // Reset the form to default values
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
            toaster.error({
                title: "Minting Error",
                description: error instanceof Error ? error.message : "Failed to mint super message",
                duration: 5000,
            });
            // Do not reset form on error so user can fix input
        },
    });

    const {
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset: resetForm,
        setValue,
        getValues
    } = useForm<FormValues>({
        defaultValues: {
            content: [],
            messageType: 'no_policy',
            timeFrom: Math.floor(Date.now() / 1000),
            timeTo: Math.floor(Date.now() / 1000) + 86400,
            maxReads: 1,
            fee: 0,
            recipient: '',
            coinType: '0x2::sui::SUI',
        }
    });

    const messageType = watch('messageType');
    const content = watch('content');

    const createSuperMessage = (data: FormValues): MessageBase => {
        let message: MessageBase;

        if (!currentAccount) {
            throw new Error("Not connected");
        }

        switch (messageType) {
            case 'no_policy':
                message = new SuperMessageNoPolicy({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                })
                break;
            case 'limited_read':
                message = new SuperMessageLimitedRead({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                    policy: {
                        maxReads: data.maxReads,
                    }
                })
                break;
            case 'fee_based':
                message = new SuperMessageFeeBased({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                    policy: {
                        feeAmount: BigInt(data.fee),
                        coinType: data.coinType,
                    },
                })
                break;
            case 'time_lock':
                message = new SuperMessageTimeLock({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                    policy: {
                        endTime: data.timeTo,
                        startTime: data.timeFrom,
                    }
                })
                break;
            case 'compound':
                message = new SuperMessageCompound({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                    feePolicy: {
                        feeAmount: BigInt(data.fee),
                        coinType: data.coinType,
                    },
                    timeLock: {
                        endTime: data.timeTo,
                        startTime: data.timeFrom,
                    },
                    limitedRead: {
                        maxReads: data.maxReads,
                    }
                })
                break;
        }

        if (!message) {
            throw new Error("Failed to create message");
        }

        return message;
    }

    // --- Submit Handler ---
    const onSubmit = async (data: FormValues) => {

        let message = createSuperMessage(data);

        message = await encryptMessage(message);
        message = await storeMessage(message);
        console.log("Message after minting:", message);

        try {
            const params: Partial<MintParams> & { type: SuperMessageType, groupId: string } = {
                type: data.messageType,
                groupId: group.id, // Use group id from hook
                metadataBlobId: message.getData().blobId || "0xdc78ccceb13d754d2989b89b2190497ed6344d22a4304714face0880fb7ddfff", // Placeholder, replace with actual blob ID
            };

            // Add policy-specific parameters, converting to BigInt where needed
            switch (data.messageType) {
                case 'time_lock':
                    params.timeFrom = BigInt(data.timeFrom);
                    params.timeTo = BigInt(data.timeTo);
                    break;
                case 'limited_read':
                    params.maxReads = BigInt(data.maxReads);
                    break;
                case 'fee_based':
                    params.fee = BigInt(data.fee); // Already BigInt in mutation, but ensure conversion if needed
                    params.recipient = data.recipient;
                    params.coinType = data.coinType;
                    break;
                case 'compound':
                    params.timeFrom = BigInt(data.timeFrom);
                    params.timeTo = BigInt(data.timeTo);
                    params.maxReads = BigInt(data.maxReads);
                    params.fee = BigInt(data.fee); // Already BigInt in mutation
                    params.recipient = data.recipient;
                    params.coinType = data.coinType;
                    break;
                // No extra params for 'no_policy'
            }

            mintSuperMessage(params as MintParams); // Assert as full MintParams

        } catch (error) {
            console.error("Pre-mutation validation error:", error);
            toaster.error({
                title: "Validation Error",
                description: error instanceof Error ? error.message : "Invalid input values",
                duration: 5000,
            });
        }
    };

    const renderSpecificInputs = () => {
        // Use a smaller gap for inputs within the composer
        const inputStackProps = { gap: 2, w: "full" };

        switch (messageType) {
            case 'time_lock':
                return (
                    <HStack {...inputStackProps} align="flex-start">
                        <Controller
                            name="timeFrom"
                            control={control}
                            rules={{ required: "Time From is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeFrom} required width="50%">
                                    <Field.Label fontSize="sm">From (Unix)</Field.Label>
                                    <NumberInput.Root
                                        size="sm" // Smaller size
                                        disabled={isPending}
                                        value={field.value?.toString() ?? ''}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.timeFrom && <Text fontSize="xs" color="red.500">{errors.timeFrom.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="timeTo"
                            control={control}
                            rules={{ required: "Time To is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeTo} required width="50%">
                                    <Field.Label fontSize="sm">To (Unix)</Field.Label>
                                    <NumberInput.Root
                                        size="sm"
                                        disabled={isPending}
                                        value={field.value?.toString() ?? ''}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.timeTo && <Text fontSize="xs" color="red.500">{errors.timeTo.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </HStack>
                );

            case 'limited_read':
                return (
                    <Stack {...inputStackProps}>
                        <Controller
                            name="maxReads"
                            control={control}
                            rules={{ required: "Max Reads is required", min: { value: 1, message: "Must be >= 1" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.maxReads} required>
                                    <Field.Label fontSize="sm">Max Reads</Field.Label>
                                    <NumberInput.Root
                                        size="sm"
                                        disabled={isPending}
                                        min={1}
                                        value={field.value?.toString() ?? ''}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.maxReads && <Text fontSize="xs" color="red.500">{errors.maxReads.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </Stack>
                );

            case 'fee_based':
                return (
                    <Stack {...inputStackProps}>
                        <Controller
                            name="fee"
                            control={control}
                            rules={{ required: "Fee is required", min: { value: 0, message: "Must be >= 0" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.fee} required>
                                    <Field.Label fontSize="sm">Fee (atomic units)</Field.Label>
                                    <NumberInput.Root
                                        size="sm"
                                        disabled={isPending}
                                        min={0}
                                        value={field.value?.toString() ?? ''}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.fee && <Text fontSize="xs" color="red.500">{errors.fee.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="recipient"
                            control={control}
                            rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address (0x...64 chars)" } }} // Example: Sui address format
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.recipient} required>
                                    <Field.Label fontSize="sm">Recipient Address</Field.Label>
                                    <Input
                                        size="sm" // Smaller size
                                        // rounded={"full"} // Maybe not full round for better space use
                                        variant={"outline"} // Standard input look
                                        disabled={isPending}
                                        placeholder="0x..."
                                        {...field}
                                    />
                                    {errors.recipient && <Text fontSize="xs" color="red.500">{errors.recipient.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="coinType"
                            control={control}
                            rules={{ required: "Coin Type is required" }} // Add specific pattern if needed
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.coinType} required>
                                    <Field.Label fontSize="sm">Coin Type</Field.Label>
                                    <Input
                                        size="sm"
                                        disabled={isPending}
                                        placeholder="e.g., 0x2::sui::SUI"
                                        {...field}
                                    />
                                    {errors.coinType && <Text fontSize="xs" color="red.500">{errors.coinType.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </Stack>
                );

            case 'compound':
                return (
                    <Stack {...inputStackProps}>
                        {/* Re-use Time Lock inputs */}
                        <HStack w="full" align="flex-start">
                            <Controller
                                name="timeFrom"
                                control={control}
                                rules={{ required: "Time From is required" }}
                                render={({ field }) => (
                                    <Field.Root invalid={!!errors.timeFrom} required width="50%">
                                        <Field.Label fontSize="sm">From (Unix)</Field.Label>
                                        <NumberInput.Root size="sm" disabled={isPending} value={field.value?.toString() ?? ''} onChange={(value) => field.onChange(value)}>
                                            <NumberInput.Control />
                                            <NumberInput.Input onBlur={field.onBlur} />
                                        </NumberInput.Root>
                                        {errors.timeFrom && <Text fontSize="xs" color="red.500">{errors.timeFrom.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                            <Controller
                                name="timeTo"
                                control={control}
                                rules={{ required: "Time To is required" }}
                                render={({ field }) => (
                                    <Field.Root invalid={!!errors.timeTo} required width="50%">
                                        <Field.Label fontSize="sm">To (Unix)</Field.Label>
                                        <NumberInput.Root size="sm" disabled={isPending} value={field.value?.toString() ?? ''} onChange={(value) => field.onChange(value)}>
                                            <NumberInput.Control />
                                            <NumberInput.Input onBlur={field.onBlur} />
                                        </NumberInput.Root>
                                        {errors.timeTo && <Text fontSize="xs" color="red.500">{errors.timeTo.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                        </HStack>
                        {/* Re-use Limited Read input */}
                        <Controller
                            name="maxReads"
                            control={control}
                            rules={{ required: "Max Reads is required", min: { value: 1, message: ">= 1" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.maxReads} required>
                                    <Field.Label fontSize="sm">Max Reads</Field.Label>
                                    <NumberInput.Root size="sm" disabled={isPending} min={1} value={field.value?.toString() ?? ''} onChange={(value) => field.onChange(value)}>
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.maxReads && <Text fontSize="xs" color="red.500">{errors.maxReads.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        {/* Re-use Fee Based inputs */}
                        <Controller
                            name="fee"
                            control={control}
                            rules={{ required: "Fee is required", min: { value: 0, message: ">= 0" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.fee} required>
                                    <Field.Label fontSize="sm">Fee (atomic)</Field.Label>
                                    <NumberInput.Root size="sm" disabled={isPending} min={0} value={field.value?.toString() ?? ''} onChange={(value) => field.onChange(value)}>
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    {errors.fee && <Text fontSize="xs" color="red.500">{errors.fee.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="recipient"
                            control={control}
                            rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.recipient} required>
                                    <Field.Label fontSize="sm">Recipient Addr</Field.Label>
                                    <Input size="sm" variant={"outline"} disabled={isPending} placeholder="0x..." {...field} />
                                    {errors.recipient && <Text fontSize="xs" color="red.500">{errors.recipient.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="coinType"
                            control={control}
                            rules={{ required: "Coin Type is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.coinType} required>
                                    <Field.Label fontSize="sm">Coin Type</Field.Label>
                                    <Input size="sm" disabled={isPending} placeholder="0x2::sui::SUI" {...field} />
                                    {errors.coinType && <Text fontSize="xs" color="red.500">{errors.coinType.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </Stack>
                );

            case 'no_policy':
                // Optionally show a confirmation or nothing
                return <Text fontSize="sm" color="gray.500" py={2}>Standard message (no specific policy).</Text>;

            default:
                return null;
        }
    };

    // --- Policy Select Options ---
    const policies = createListCollection({
        items: [
            { label: "No Policy", value: "no_policy" as SuperMessageType },
            { label: "Time Lock", value: "time_lock" as SuperMessageType },
            { label: "Limited Read", value: "limited_read" as SuperMessageType },
            { label: "Fee Based", value: "fee_based" as SuperMessageType },
            { label: "Compound", value: "compound" as SuperMessageType },
        ]
    });

    return (
        <VStack
            as="form" // Use form element for submit handling
            onSubmit={handleSubmit(onSubmit)} // Handle submit here
            w={"full"}
            p={"3"}
            bg={"bg.100/75"} // Existing styles
            backdropBlur={"2xl"}
            shadow={"custom.sm"}
            rounded={"3xl"}
            gap={3}
            alignItems="stretch" // Ensure children stretch full width
            {...props}
        >
            {/* 1. Message Text Input */}
            <Controller
                name="content"
                control={control}
                // Add rules if message text is required even for super messages
                // rules={{ required: "Message cannot be empty" }}
                render={({ field }) => (
                    <MessageInput
                        value={field.value.toString()}
                        onChange={field.onChange}
                        disabled={isPending}
                        placeholder={messageType !== 'no_policy' ? "Optional: Add text context for the Super Message..." : "Type your message..."}
                    />
                    // {errors.messageText && <Text fontSize="xs" color="red.500">{errors.messageText.message}</Text>}
                )}
            />


            {/* 2. Policy Selection and Metadata ID */}
            <HStack align="flex-start" gap={2}>
                {/* Policy Select */}
                <Field.Root invalid={!!errors.messageType} required flex={1}>
                    <Field.Label fontSize="sm">Policy</Field.Label>
                    <Controller
                        name="messageType"
                        control={control}
                        rules={{ required: "Policy type is required" }}
                        render={({ field }) => (
                            <SelectRoot
                                size="sm" // Smaller select
                                disabled={isPending}
                                collection={policies}
                                value={[field.value]} // Use controlled value
                                onValueChange={({ value }) => {field.onChange(value[0]); console.log(value)}} // Update form state
                                onInteractOutside={() => field.onBlur()} // Trigger validation
                            >
                                <SelectHiddenSelect />
                                <SelectControl>
                                    <SelectTrigger>
                                        <SelectValueText placeholder="Select policy" />
                                    </SelectTrigger>
                                </SelectControl>
                                <SelectContent> {/* Use portal if needed */}
                                    {policies.items.map((policy) => (
                                        <SelectItem item={policy} key={policy.value}>
                                            {policy.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                            // {errors.messageType && <Text fontSize="xs" color="red.500">{errors.messageType.message}</Text>}
                        )}
                    />
                </Field.Root>
            </HStack>


            {/* 3. Policy Specific Inputs */}
            {renderSpecificInputs()}

            {/* 4. Error Display and Submit Button */}
            <Stack gap={2} w="full" alignItems="flex-end">
                {isError && (
                    <Text color="red.500" fontSize="sm" w="full" textAlign="left">
                        Error: {error instanceof Error ? error.message : "An unknown error occurred"}
                    </Text>
                )}

                <Button
                    type="submit" // Important: Make this button trigger the form submission
                    colorPalette="primary" // Use your theme's primary color
                    loading={isPending}
                    loadingText="Minting..."
                    size="sm" // Smaller button
                    disabled={isPending || !group?.id} // Disable if pending or no group
                >
                    <FaSuperpowers />
                    Mint Super Message
                </Button>
            </Stack>

        </VStack>
    );
}