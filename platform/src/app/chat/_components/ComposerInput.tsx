"use client";

import { ButtonProps, Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { FaSuperpowers } from "react-icons/fa";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";

import {
    Input,
    NumberInput,
    Text,
    Stack,
    Field,
    createListCollection,
    SelectHiddenSelect,
    SelectControl,
    StackProps,
    VStack,
    HStack,
    Span,
    SelectItemText,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useGroup } from "../_hooks/useGroupId";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";
import { TMessageBase } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MessageBase, SuperMessageCompound, SuperMessageFeeBased, SuperMessageLimitedRead, SuperMessageNoPolicy, SuperMessageTimeLock } from "@/sdk";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSealClient } from "@/hooks/useSealClient";
import MessageInput from "./MessageInput";
import { useState } from "react";
import { DatePickerInput } from "@/components/ui/date-picker";

const MotionVStack = motion.create(VStack);

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

    const [isSelectExpanded, setIsSelectExpanded] = useState(false);

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
            queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });

            toaster.success({
                title: "Success",
                description: "Super message minted successfully",
                duration: 5000,
            });

            if (onMessageMinted) {
            }

            resetMutation();
            resetForm();
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
            toaster.error({
                title: "Minting Error",
                description: error instanceof Error ? error.message : "Failed to mint super message",
                duration: 5000,
            });
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
        console.log("Form submitted with data:", data);
        return;
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
                    params.fee = BigInt(data.fee);
                    params.recipient = data.recipient;
                    params.coinType = data.coinType;
                    break;
            }

            mintSuperMessage(params as MintParams);

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
        const inputStackProps = { gap: 2, w: "full" };

        switch (messageType) {
            case 'time_lock':
                return (
                    <HStack {...inputStackProps}>
                        <Controller
                            name="timeFrom"
                            control={control}
                            rules={{ required: "Time From is required" }}
                            render={({ field }) => (
                                <Field.Root w={"full"} invalid={!!errors.timeFrom} required width="50%">
                                    <Field.Label fontSize="sm">From</Field.Label>
                                    <DatePicker
                                        selected={field.value ? new Date(field.value * 1000) : null} // Convert timestamp to Date
                                        onChange={(date: Date | null) => {
                                            const timestamp = date ? Math.floor(date.getTime() / 1000) : 0;
                                            field.onChange(timestamp);
                                        }}
                                        onBlur={field.onBlur}
                                        customInput={<DatePickerInput w={"full"} />}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="yyyy-MM-dd HH:mm"
                                        isClearable
                                        placeholderText="Select start date/time"
                                        disabled={isPending}
                                        popperPlacement="bottom-start"
                                    />
                                    {errors.timeFrom && <Text fontSize="xs" color="red.500">{errors.timeFrom.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="timeTo"
                            control={control}
                            rules={{
                                required: "End date/time is required",
                                validate: (value) => {
                                    const timeFromValue = getValues("timeFrom");
                                    return (typeof value === 'number' && typeof timeFromValue === 'number' && value > timeFromValue) || "End time must be after start time";
                                }
                            }}
                            render={({ field, fieldState }) => {
                                const timeFromValue = getValues("timeFrom");
                                const minDate = timeFromValue ? new Date(timeFromValue * 1000) : new Date();

                                return (
                                    <Field.Root invalid={!!fieldState.error} required width="50%">
                                        <Field.Label fontSize="sm">End Time</Field.Label>
                                        <DatePicker
                                            selected={field.value ? new Date(field.value * 1000) : new Date()}
                                            onChange={(date: Date | null) => {
                                                const timestamp = date ? Math.floor(date.getTime() / 1000) : 0;
                                                field.onChange(timestamp);
                                            }}
                                            onBlur={field.onBlur}
                                            customInput={<DatePickerInput />}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="yyyy-MM-dd HH:mm"
                                            isClearable
                                            placeholderText="Select end date/time"
                                            disabled={isPending}
                                            popperPlacement="bottom-start"
                                            minDate={minDate}
                                            filterTime={(time) => {
                                                if (!minDate || !field.value || !time) return true;
                                                const selectedDate = new Date(field.value * 1000);
                                                if (selectedDate.toDateString() === minDate.toDateString()) {
                                                    return time.getTime() > minDate.getTime();
                                                }
                                                return true;
                                            }}
                                        />
                                        {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                    </Field.Root>
                                );
                            }}
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
                                        variant={"subtle"}
                                        size="sm"
                                        disabled={isPending}
                                        min={1}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input bg={"bg.300"} rounded={"lg"} onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    <Field.HelperText color={"fg.contrast"}>Min value 1</Field.HelperText>
                                    {errors.maxReads && <Text fontSize="xs" color="red.500">{errors.maxReads.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </Stack>
                );

            case 'fee_based':
                return (
                    <HStack align={"start"} {...inputStackProps}>
                        <Controller
                            name="fee"
                            control={control}
                            rules={{ required: "Fee is required", min: { value: 0, message: "Must be >= 0" } }}
                            render={({ field }) => (
                                <Field.Root flex={"1"} invalid={!!errors.fee} required>
                                    <Field.Label fontSize="sm">Fee</Field.Label>
                                    <NumberInput.Root
                                        w={"full"}
                                        variant={"subtle"}
                                        size="sm"
                                        disabled={isPending}
                                        min={0}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Input bg={"bg.300"} rounded={"lg"} onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    <Field.HelperText color={"fg.contrast"}>Atomic units</Field.HelperText>
                                    {errors.fee && <Text fontSize="xs" color="red.500">{errors.fee.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="coinType"
                            control={control}
                            rules={{ required: "Coin Type is required" }}
                            render={({ field }) => (
                                <Field.Root flex={"2"} invalid={!!errors.coinType} required>
                                    <Field.Label fontSize="sm">Coin Type</Field.Label>
                                    <Input
                                        size="sm"
                                        w={"full"}
                                        variant={"subtle"}
                                        bg={"bg.300"}
                                        rounded={"lg"}
                                        _placeholder={{
                                            color: "fg.contrast"
                                        }}
                                        disabled={isPending}
                                        placeholder="e.g., 0x2::sui::SUI"
                                        {...field}
                                    />
                                    {errors.coinType && <Text fontSize="xs" color="red.500">{errors.coinType.message}</Text>}
                                </Field.Root>
                            )}
                        />
                        <Controller
                            name="recipient"
                            control={control}
                            rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address (0x...64 chars)" } }} // Example: Sui address format
                            render={({ field }) => (
                                <Field.Root flex={"3"} invalid={!!errors.recipient} required>
                                    <Field.Label fontSize="sm">Recipientess</Field.Label>
                                    <Input
                                        size="sm"
                                        w={"full"}
                                        variant={"subtle"}
                                        bg={"bg.300"}
                                        rounded={"lg"}
                                        _placeholder={{
                                            color: "fg.contrast"
                                        }}
                                        disabled={isPending}
                                        placeholder="0x..."
                                        {...field}
                                    />
                                    {errors.recipient && <Text fontSize="xs" color="red.500">{errors.recipient.message}</Text>}
                                </Field.Root>
                            )}
                        />
                    </HStack>
                );

            case 'compound':
                return (
                    <Stack {...inputStackProps}>
                        <HStack w="full" align="start">
                            <HStack w="full" align="flex-start">
                                <Controller name="timeFrom"
                                    control={control}
                                    render={
                                        ({ field, fieldState }) => (
                                            <Field.Root invalid={!!fieldState.error}
                                                required width="50%"
                                            >
                                                <Field.Label fontSize="sm">Start Time</Field.Label>
                                                <DatePicker
                                                    selected={field.value ? new Date(field.value * 1000) : new Date()}
                                                    onChange={(date: Date | null) => field.onChange(date ? Math.floor(date.getTime() / 1000) : 0)}
                                                    customInput={<DatePickerInput />}
                                                    showTimeSelect
                                                    dateFormat="yyyy-MM-dd HH:mm"
                                                />
                                                {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                            </Field.Root>
                                        )} />
                                <Controller name="timeTo" control={control} /* ... */ render={({ field, fieldState }) => {
                                    const timeFromValue = getValues("timeFrom");
                                    const minDate = timeFromValue ? new Date(timeFromValue * 1000) : new Date();
                                    return (
                                        <Field.Root invalid={!!fieldState.error} required width="50%">
                                            <Field.Label fontSize="sm">End Time</Field.Label>
                                            <DatePicker /* ... props giống time_lock ... */
                                                selected={field.value ? new Date(field.value * 1000) : null}
                                                onChange={(date: Date | null) => field.onChange(date ? Math.floor(date.getTime() / 1000) : 0)}
                                                customInput={<DatePickerInput />}
                                                showTimeSelect
                                                dateFormat="yyyy-MM-dd HH:mm"
                                                minDate={minDate}
                                            />
                                            {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                                        </Field.Root>
                                    );
                                }} />
                            </HStack>
                            <Controller
                                name="maxReads"
                                control={control}
                                rules={{ required: "Max Reads is required", min: { value: 1, message: ">= 1" } }}
                                render={({ field }) => (
                                    <Field.Root w={"full"} invalid={!!errors.maxReads} required>
                                        <Field.Label fontSize="sm">Max Reads</Field.Label>
                                        <NumberInput.Root w={"full"} variant={"subtle"} size="sm" disabled={isPending} min={1} onChange={(value) => field.onChange(value)}>
                                            <NumberInput.Input rounded={"lg"} bg={"bg.300"} onBlur={field.onBlur} />
                                        </NumberInput.Root>
                                        {errors.maxReads && <Text fontSize="xs" color="red.500">{errors.maxReads.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                        </HStack>
                        <HStack w="full" align="start">
                            <Controller
                                name="fee"
                                control={control}
                                rules={{ required: "Fee is required", min: { value: 0, message: ">= 0" } }}
                                render={({ field }) => (
                                    <Field.Root flex={"1"} invalid={!!errors.fee} required>
                                        <Field.Label fontSize="sm">Fee</Field.Label>
                                        <NumberInput.Root variant={"subtle"}
                                            size="sm" disabled={isPending} min={0} onChange={(value) => field.onChange(value)}>
                                            <NumberInput.Input w={"full"} rounded={"lg"} bg={"bg.300"} onBlur={field.onBlur} />
                                        </NumberInput.Root>
                                        <Field.HelperText color={"fg.contrast"}>Atomic units</Field.HelperText>
                                        {errors.fee && <Text fontSize="xs" color="red.500">{errors.fee.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                            <Controller
                                name="coinType"
                                control={control}
                                rules={{ required: "Coin Type is required" }}
                                render={({ field }) => (
                                    <Field.Root flex={"2"} invalid={!!errors.coinType} required>
                                        <Field.Label fontSize="sm">Coin Type</Field.Label>
                                        <Input size="sm" w={"full"} rounded={"lg"} bg={"bg.300"} _placeholder={{ color: "fg.contrast" }} disabled={isPending} placeholder="0x2::sui::SUI" {...field} />
                                        {errors.coinType && <Text fontSize="xs" color="red.500">{errors.coinType.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                            <Controller
                                name="recipient"
                                control={control}
                                rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } }}
                                render={({ field }) => (
                                    <Field.Root flex={"3"} invalid={!!errors.recipient} required>
                                        <Field.Label fontSize="sm">Recipient</Field.Label>
                                        <Input w={"full"} size="sm" rounded={"lg"} bg={"bg.300"} _placeholder={{ color: "fg.contrast" }} variant={"subtle"} disabled={isPending} placeholder="0x..." {...field} />
                                        {errors.recipient && <Text fontSize="xs" color="red.500">{errors.recipient.message}</Text>}
                                    </Field.Root>
                                )}
                            />
                        </HStack>
                    </Stack>
                );

            case 'no_policy':
                return null;

            default:
                return null;
        }
    };

    // --- Policy Select Options ---
    const policies = createListCollection({
        items: [
            { label: "No Policy", description: "Standard storage message, no access policy", value: "no_policy" as SuperMessageType },
            { label: "Time Lock", description: "Access only within time window", value: "time_lock" as SuperMessageType },
            { label: "Limited Read", description: "Limit total message reads allowed", value: "limited_read" as SuperMessageType },
            { label: "Fee Based", description: "Access message upon fee payment", value: "fee_based" as SuperMessageType },
            { label: "Compound", description: "Multiple access rules apply together", value: "compound" as SuperMessageType },
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
            <HStack align="flex-start" gap={2}>
                <Controller
                    name="messageType"
                    control={control}
                    rules={{ required: "Policy type is required" }}
                    render={({ field }) => (
                        <MotionVStack
                            animate={{ width: isSelectExpanded ? "24rem" : "8rem" }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <SelectRoot
                                size="md"
                                disabled={isPending}
                                collection={policies}
                                value={[field.value]}
                                onValueChange={({ value }) => {
                                    field.onChange(value[0]),
                                        setIsSelectExpanded(false)
                                }
                                }
                                onOpenChange={(d) => {
                                    setIsSelectExpanded(d.open)
                                }}
                                onInteractOutside={() => field.onBlur()}
                            >
                                <SelectHiddenSelect />
                                <SelectControl>
                                    <SelectTrigger>
                                        <SelectValueText placeholder="Select policy" />
                                    </SelectTrigger>
                                </SelectControl>
                                <SelectContent>
                                    {policies.items.map((policy) => (
                                        <SelectItem item={policy} key={policy.value}>
                                            <Stack gap={0}>
                                                <SelectItemText>{policy.label}</SelectItemText>
                                                <Span color={"fg.contrast"} fontSize="xs">
                                                    {policy.description}
                                                </Span>
                                            </Stack>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>
                            {errors.messageType && <Text fontSize="xs" color="red.500">{errors.messageType.message}</Text>}
                        </MotionVStack>
                    )}
                />
            </HStack>

            <Controller
                name="content"
                control={control}
                render={({ field }) => (
                    <MessageInput
                        value={field.value.toString()}
                        onChange={field.onChange}
                        disabled={isPending}
                        placeholder={messageType !== 'no_policy' ? "Optional: Add text context for the Super Message..." : "Type your message..."}
                        tools={
                            <Stack gap={2} alignItems="flex-end">
                                {isError && (
                                    <Text color="red.500" fontSize="sm" w="full" textAlign="left">
                                        Error: {error instanceof Error ? error.message : "An unknown error occurred"}
                                    </Text>
                                )}

                                <Button
                                    type="submit"
                                    colorPalette="primary"
                                    loading={isPending}
                                    loadingText="Minting..."
                                    size="sm"
                                    disabled={isPending || !group?.id}
                                >
                                    <FaSuperpowers />
                                    Mint
                                </Button>
                            </Stack>
                        }
                    />
                    // {errors.messageText && <Text fontSize="xs" color="red.500">{errors.messageText.message}</Text>}
                )}
            />

            {renderSpecificInputs()}
        </VStack>
    );
}