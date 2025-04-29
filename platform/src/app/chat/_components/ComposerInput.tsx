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
import { MediaContent, TMessageBase } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MessageBase, SuperMessageCompound, SuperMessageFeeBased, SuperMessageLimitedRead, SuperMessageNoPolicy, SuperMessageTimeLock } from "@/sdk";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSealClient } from "@/hooks/useSealClient";
import { MediaInput, TextInput } from "./MessageInput";
import { useCallback, useState } from "react";
import { DatePickerInput } from "@/components/ui/date-picker";
import { nanoid } from "nanoid";

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
    contentAsFiles: File[];
    contentAsText: string;
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
    const { group } = useGroup();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const {
        mintSuperMessageTimeLockAndTransfer,
        mintSuperMessageNoPolicyAndTransfer,
        mintSuperMessageFeeBasedAndTransfer,
        mintSuperMessageLimitedReadAndTransfer,
        mintSuperMessageCompoundAndTransfer,
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
                    tx = await mintSuperMessageTimeLockAndTransfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
                    break
                case 'limited_read':
                    if (!params.maxReads) throw new Error("Missing maxReads for Limited Read");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Limited Read");
                    tx = await mintSuperMessageLimitedReadAndTransfer(group.id, params.metadataBlobId, params.maxReads);
                    break
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient || !params.coinType) throw new Error("Missing parameters for Fee Based");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Fee Based");
                    tx = await mintSuperMessageFeeBasedAndTransfer(group.id, params.metadataBlobId, BigInt(params.fee), params.recipient, params.coinType);
                    break
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads || params.fee === undefined || !params.recipient || !params.coinType)
                        throw new Error("Missing parameters for Compound");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Compound");
                    tx = await mintSuperMessageCompoundAndTransfer(
                        group.id,
                        params.metadataBlobId,
                        params.timeFrom,
                        params.timeTo,
                        params.maxReads,
                        BigInt(params.fee),
                        params.recipient,
                        params.coinType
                    );
                    break
                case 'no_policy':
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for No Policy");
                    tx = await mintSuperMessageNoPolicyAndTransfer(group.id, params.metadataBlobId);
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
        formState: { isSubmitting, errors },
        reset: resetForm,
        getValues
    } = useForm<FormValues>({
        defaultValues: {
            messageType: 'no_policy',
            contentAsFiles: [],
            contentAsText: '',
            timeFrom: Math.floor(Date.now() / 1000),
            timeTo: Math.floor(Date.now() / 1000) + 86400,
            maxReads: 1,
            fee: 0,
            recipient: '',
            coinType: '0x2::sui::SUI',
        }
    });

    const messageType = watch('messageType');

    const createSuperMessage = (data: FormValues): MessageBase => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const mediaContentAsText = {
            id: nanoid(),
            mimeType: "text/plain",
            raw: data.contentAsText,
        } satisfies MediaContent;

        const mediaContentAsFiles = data.contentAsFiles.map((file) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            return new Promise<MediaContent>((resolve) => {
                reader.onload = () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    resolve({
                        id: nanoid(),
                        mimeType: file.type,
                        raw: uint8Array,
                    });
                };
            });
        });

        const content = [mediaContentAsText, ...mediaContentAsFiles];
        const baseMessageProps = {
            data: { content },
            groupId: group.id,
            owner: currentAccount?.address,
        };

        switch (messageType) {
            case 'no_policy':
                return new SuperMessageNoPolicy(baseMessageProps);
            case 'limited_read':
                return new SuperMessageLimitedRead({
                    ...baseMessageProps,
                    policy: {
                        maxReads: data.maxReads,
                    }
                });
            case 'fee_based':
                return new SuperMessageFeeBased({
                    ...baseMessageProps,
                    policy: {
                        feeAmount: BigInt(data.fee),
                        coinType: data.coinType,
                    }
                });
            case 'time_lock':
                return new SuperMessageTimeLock({
                    ...baseMessageProps,
                    policy: {
                        endTime: data.timeTo,
                        startTime: data.timeFrom,
                    }
                });
            case 'compound':
                return new SuperMessageCompound({
                    ...baseMessageProps,
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
                });
            default:
                throw new Error("Failed to create message: Unknown message type");
        }
    }

    const onSubmit = async (data: FormValues) => {
        let message = createSuperMessage(data);
        console.log("Message created:", message);
        message = await encryptMessage(message);
        console.log("Message created:", message);
        message = await storeMessage(message);

        try {
            const params: Partial<MintParams> & { type: SuperMessageType, groupId: string } = {
                type: data.messageType,
                groupId: group.id,
                metadataBlobId: message.getData().blobId,
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
                    params.fee = BigInt(data.fee);
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

    const renderDatePickerField = (name: "timeFrom" | "timeTo", label: string, minDate?: Date, validation?: any) => (
        <Controller
            name={name}
            control={control}
            rules={validation || { required: `${label} is required` }}
            render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error} required width="50%">
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <DatePicker
                        selected={field.value ? new Date(field.value * 1000) : null}
                        onChange={(date: Date | null) => {
                            const timestamp = date ? Math.floor(date.getTime() / 1000) : 0;
                            field.onChange(timestamp);
                        }}
                        onBlur={field.onBlur}
                        customInput={<DatePickerInput w={name === "timeFrom" ? "full" : undefined} />}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="yyyy-MM-dd HH:mm"
                        isClearable
                        placeholderText={`Select ${label.toLowerCase()}`}
                        disabled={isPending}
                        popperPlacement="bottom-start"
                        minDate={minDate}
                        filterTime={minDate && name === "timeTo" ? (time) => {
                            if (!minDate || !field.value || !time) return true;
                            const selectedDate = new Date(field.value * 1000);
                            if (selectedDate.toDateString() === minDate.toDateString()) {
                                return time.getTime() > minDate.getTime();
                            }
                            return true;
                        } : undefined}
                    />
                    {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                </Field.Root>
            )}
        />
    );

    const renderNumberField = (name: "maxReads" | "fee", label: string, helperText?: string, min: number = 0) => (
        <Controller
            name={name}
            control={control}
            rules={{ required: `${label} is required`, min: { value: min, message: `Must be >= ${min}` } }}
            render={({ field }) => (
                <Field.Root flex={name === "fee" ? "1" : undefined} w={name === "maxReads" ? "full" : undefined} invalid={!!errors[name]} required>
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <NumberInput.Root
                        w={name === "maxReads" || name === "fee" ? "full" : undefined}
                        variant="subtle"
                        size="sm"
                        disabled={isPending}
                        min={min}
                        onChange={(value) => field.onChange(value)}
                    >
                        {name === "maxReads" ? <NumberInput.Control /> : null}
                        <NumberInput.Input bg="bg.300" rounded="lg" onBlur={field.onBlur} />
                    </NumberInput.Root>
                    {helperText && <Field.HelperText color="fg.contrast">{helperText}</Field.HelperText>}
                    {errors[name] && <Text fontSize="xs" color="red.500">{errors[name]?.message}</Text>}
                </Field.Root>
            )}
        />
    );

    const renderTextField = (name: "coinType" | "recipient", label: string, placeholder: string, flex: string, validation?: any) => (
        <Controller
            name={name}
            control={control}
            rules={validation || { required: `${label} is required` }}
            render={({ field }) => (
                <Field.Root flex={flex} invalid={!!errors[name]} required>
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <Input
                        size="sm"
                        w="full"
                        variant="subtle"
                        bg="bg.300"
                        rounded="lg"
                        _placeholder={{ color: "fg.contrast" }}
                        disabled={isPending}
                        placeholder={placeholder}
                        {...field}
                    />
                    {errors[name] && <Text fontSize="xs" color="red.500">{errors[name]?.message}</Text>}
                </Field.Root>
            )}
        />
    );

    const renderSpecificInputs = () => {
        const inputStackProps = { gap: 2, w: "full" };

        switch (messageType) {
            case 'time_lock':
                return (
                    <HStack {...inputStackProps}>
                        {renderDatePickerField("timeFrom", "From")}
                        {renderDatePickerField("timeTo", "End Time",
                            getValues("timeFrom") ? new Date(getValues("timeFrom") * 1000) : new Date(),
                            {
                                required: "End date/time is required",
                                validate: (value: number) => {
                                    const timeFromValue = getValues("timeFrom");
                                    return (typeof value === 'number' && typeof timeFromValue === 'number' && value > timeFromValue) || "End time must be after start time";
                                }
                            }
                        )}
                    </HStack>
                );

            case 'limited_read':
                return (
                    <Stack {...inputStackProps}>
                        {renderNumberField("maxReads", "Max Reads", "Min value 1", 1)}
                    </Stack>
                );

            case 'fee_based':
                return (
                    <HStack align="start" {...inputStackProps}>
                        {renderNumberField("fee", "Fee", "Atomic units")}
                        {renderTextField("coinType", "Coin Type", "e.g., 0x2::sui::SUI", "2")}
                        {renderTextField("recipient", "Recipient", "0x...", "3",
                            { required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address (0x...64 chars)" } }
                        )}
                    </HStack>
                );

            case 'compound':
                return (
                    <Stack {...inputStackProps}>
                        <HStack w="full" align="start">
                            <HStack w="full" align="flex-start">
                                {renderDatePickerField("timeFrom", "Start Time")}
                                {renderDatePickerField("timeTo", "End Time", getValues("timeFrom") ? new Date(getValues("timeFrom") * 1000) : new Date())}
                            </HStack>
                            {renderNumberField("maxReads", "Max Reads", undefined, 1)}
                        </HStack>
                        <HStack w="full" align="start">
                            {renderNumberField("fee", "Fee", "Atomic units")}
                            {renderTextField("coinType", "Coin Type", "0x2::sui::SUI", "2")}
                            {renderTextField("recipient", "Recipient", "0x...", "3",
                                { required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } }
                            )}
                        </HStack>
                    </Stack>
                );

            case 'no_policy':
            default:
                return null;
        }
    };

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
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            w="full"
            p="3"
            bg="bg.100/75"
            backdropBlur="2xl"
            shadow="custom.sm"
            rounded="3xl"
            gap={3}
            alignItems="stretch"
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
                                    field.onChange(value[0]);
                                    setIsSelectExpanded(false);
                                }}
                                onOpenChange={(d) => {
                                    setIsSelectExpanded(d.open);
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
                                                <Span color="fg.contrast" fontSize="xs">
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

            <VStack
                pos="relative"
                gap={0}
                bg="bg.300"
                _focusWithin={{
                    outline: "1px solid",
                    outlineColor: "fg",
                    outlineOffset: "2px",
                }}
                p={2}
                rounded="3xl"
            >
                <Controller
                    name="contentAsText"
                    control={control}
                    render={({ field }) => (
                        <TextInput {...field} />
                    )}
                />
                <Controller
                    name="contentAsFiles"
                    control={control}
                    render={({ field }) => (
                        <MediaInput
                            onFileAccept={(details) => field.onChange(details.files)}
                            ref={field.ref}
                            name={field.name}
                            disabled={field.disabled}
                            onBlur={field.onBlur}
                        />
                    )}
                />

                <Stack pos="absolute" bottom="4" right="4" direction="column" gap={1} alignItems="flex-end">
                    {isError && (
                        <Text color="red.500" fontSize="xs" w="full" textAlign="left">
                            Minting Error: {error instanceof Error ? error.message : "Unknown error"}
                        </Text>
                    )}
                    <Button
                        type="submit"
                        colorPalette="primary"
                        loading={isSubmitting}
                        loadingText="Minting..."
                        size="sm"
                        disabled={isSubmitting || !group?.id}
                    >
                        <FaSuperpowers />
                        Mint Message
                    </Button>
                </Stack>
            </VStack>

            {renderSpecificInputs()}
        </VStack>
    );
}