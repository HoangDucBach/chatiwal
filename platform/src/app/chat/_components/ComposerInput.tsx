"use client";

import { useCallback, useState } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { NumericFormat } from 'react-number-format';

import { Button } from "@/components/ui/button";
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
import { encode } from "@msgpack/msgpack";

import { useGroup } from "../_hooks/useGroup";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";
import { MediaContent, MessageType, TMessage } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { useSealClient } from "@/hooks/useSealClient";
import { MediaInput, TextInput } from "./MessageInput";
import { DatePickerInput } from "@/components/ui/date-picker";
import { nanoid, random } from "nanoid";
import { useAbly, useChannel } from "ably/react";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { generateContentId } from "@/libs";
import { fromHex, SUI_DECIMALS } from "@mysten/sui/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { useChannelName } from "../_hooks/useChannelName";
import { useDirectMessageId } from "../_hooks/useDirectMessageId";
import { useMessageStore } from "../_hooks/useMessagesStore";

const MotionVStack = motion.create(VStack);

type SuperMessageType = 'time_lock' | 'limited_read' | 'fee_based' | 'compound' | 'no_policy';

type MintParams = {
    type: SuperMessageType;
    groupId: string;
    messageBlobId: string;
    auxId: Uint8Array;
    timeFrom?: bigint;
    timeTo?: bigint;
    maxReads?: bigint;
    fee?: bigint;
    recipient?: string;
    tx?: Transaction;
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
}

interface BaseComposerProps extends StackProps {
    messages?: TMessage[];
}

interface ComposerInputProps extends BaseComposerProps {
    onMessageMinted?: (message: any) => void;
}

interface ComposerInputForDirectMessageProps extends BaseComposerProps { }

// Helper functions
const createMessageFromContent = async (
    currentAccount: ReturnType<typeof useCurrentAccount>,
    messageType: MessageType,
    channelName: string,
    groupId?: string,
    formData?: FormValues
): Promise<{ messageToEncrypt: TMessage, auxId: Uint8Array }> => {
    if (!formData) throw new Error("Form data is required");
    if (!currentAccount) throw new Error("Not connected");

    const plainMessageId = nanoid();
    const auxId = messageType === MessageType.DIRECT ?
        random(16) :
        generateContentId(groupId ? fromHex(groupId) : new Uint8Array());

    const mediaContentAsText = { id: nanoid(), mimeType: "text/plain", raw: formData.contentAsText } satisfies MediaContent;

    const fileProcessingPromises = formData.contentAsFiles.map(file => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        return new Promise<MediaContent>((resolve, reject) => {
            reader.onload = () => resolve({
                id: nanoid(),
                mimeType: file.type,
                raw: new Uint8Array(reader.result as ArrayBuffer),
            });
            reader.onerror = (e) => reject(e);
        });
    });

    const resolvedMediaContentFiles = await Promise.all(fileProcessingPromises);
    const finalDataStructure: MediaContent[] = [mediaContentAsText, ...resolvedMediaContentFiles].filter(
        mc => mc.raw && (typeof mc.raw === 'string' ? mc.raw.length > 0 : mc.raw.length > 0)
    );
    const encodedUint8Array: Uint8Array = encode(finalDataStructure);

    const messageToEncrypt = {
        id: plainMessageId,
        type: messageType,
        owner: currentAccount.address,
        groupId: groupId,
        channelName: messageType === MessageType.DIRECT ? channelName : undefined,
        auxId: Array.from(auxId),
        content: encodedUint8Array,
        readers: [],
        feeCollected: {
            value: "0",
        },
        createdAt: Date.now().toString(),
    } satisfies TMessage;

    return { messageToEncrypt, auxId };
};

// Shared component functions
const renderDatePickerField = (
    name: "timeFrom" | "timeTo",
    label: string,
    control: any,
    isPending: boolean,
    isSubmitting: boolean,
    minDate?: Date,
    validation?: any
) => (
    <Controller
        name={name}
        control={control}
        rules={validation || { required: `${label} is required` }}
        render={({ field, fieldState }) => (
            <Field.Root invalid={!!fieldState.error} width="100%">
                <Field.Label fontSize="sm">{label}</Field.Label>
                <DatePicker
                    selected={field.value ? new Date(field.value * 1000) : new Date()}
                    onChange={(date: Date | null) => field.onChange(date ? Math.floor(date.getTime() / 1000) : new Date())}
                    onBlur={field.onBlur}
                    customInput={<DatePickerInput />}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={5} dateFormat="yyyy-MM-dd HH:mm"
                    isClearable placeholderText={`Select ${label.toLowerCase()}`}
                    disabled={isPending || isSubmitting}
                    popperPlacement="top-start"
                    minDate={minDate}
                    value={field.value ? new Date(field.value * 1000).toString() : new Date().toString()}
                    filterTime={minDate && name === "timeTo" ? (time) => {
                        const selectedDate = field.value ? new Date(field.value * 1000) : null;
                        if (!minDate || !selectedDate || !time) return true;
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

const renderNumberField = (
    name: "maxReads" | "fee",
    label: string,
    control: any,
    isPending: boolean,
    isSubmitting: boolean,
    helperText?: string,
    min: number = 0
) => (
    <Controller
        name={name}
        control={control}
        rules={{ required: `${label} is required`, min: { value: min, message: `Must be >= ${min}` } }}
        render={({ field: { onChange, onBlur, value, ref }, fieldState }) => (
            <Field.Root flex={name === "fee" ? "1" : undefined} w={name === "maxReads" ? "full" : undefined} invalid={!!fieldState.error} >
                <Field.Label fontSize="sm">{label}</Field.Label>
                <NumericFormat
                    customInput={Input}
                    variant={"subtle"}
                    size="sm"
                    bg="bg.300"
                    rounded="lg"
                    allowNegative={false}
                    value={value}
                    thousandSeparator={true}
                    allowedDecimalSeparators={[".", ","]}
                    onValueChange={(valNum) => onChange(valNum.floatValue)}
                />
                {helperText && <Field.HelperText color="fg.contrast">{helperText}</Field.HelperText>}
                {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
            </Field.Root>
        )}
    />
);

const renderTextField = (
    name: "recipient",
    label: string,
    placeholder: string,
    control: any,
    isPending: boolean,
    isSubmitting: boolean,
    flex: string,
    validation?: any,
    required?: boolean
) => (
    <Controller
        name={name}
        control={control}
        rules={validation || (required ? { required: `${label} is required` } : {})}
        render={({ field, fieldState }) => (
            <Field.Root flex={flex} invalid={!!fieldState.error} >
                <Field.Label fontSize="sm">{label}</Field.Label>
                <Input
                    size="sm" w="full" variant="subtle" bg="bg.300" rounded="lg"
                    _placeholder={{ color: "fg.contrast" }}
                    disabled={isPending || isSubmitting}
                    placeholder={placeholder}
                    {...field}
                />
                {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
            </Field.Root>
        )}
    />
);

export function ComposerInput(props: ComposerInputProps) {
    const { channelName } = useChannelName();
    const channelType = AblyChannelManager.getChannelType(channelName);
    const { publish } = useChannel({ channelName });
    const { group } = useGroup();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const {
        mintSuperMessageTimeLockAndTransfer,
        mintSuperMessageNoPolicyAndTransfer,
        mintSuperMessageFeeBasedAndTransfer,
        mintSuperMessageLimitedReadAndTransfer,
        mintSuperMessageCompoundAndTransfer,
    } = useChatiwalClient();
    const { encrypt } = useSealClient();
    const { storeReturnTransaction } = useWalrusClient();
    const { client } = useChatiwalClient();
    const { addSuperMessage } = useSupabase();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isSelectExpanded, setIsSelectExpanded] = useState(false);
    const moduleMessagePrefix = client.getPackageConfig().moduleMessagePrefix;

    const { mutate: mintSuperMessage, isPending, isError, error, reset: resetMutation } = useMutation({
        mutationFn: async (params: MintParams) => {
            if (!group?.id) throw new Error("Group ID is not available");
            if (!currentAccount) throw new Error("Not connected");

            let tx = params.tx;
            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo || !params.messageBlobId || !params.auxId)
                        throw new Error("Missing parameters for Time Lock");
                    tx = await mintSuperMessageTimeLockAndTransfer(
                        group.id, params.messageBlobId, params.auxId, params.timeFrom, params.timeTo,
                        {
                            tx,
                        }
                    );
                    break;
                case 'limited_read':
                    if (!params.maxReads || !params.messageBlobId || !params.auxId)
                        throw new Error("Missing parameters for Limited Read");
                    tx = await mintSuperMessageLimitedReadAndTransfer(
                        group.id, params.messageBlobId, params.auxId, params.maxReads,
                        {
                            tx,
                        }
                    );
                    break;
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient)
                        throw new Error("Missing parameters for Fee Based");
                    tx = await mintSuperMessageFeeBasedAndTransfer(
                        group.id, params.messageBlobId, params.auxId, BigInt(params.fee), params.recipient,
                        {
                            tx,
                        }
                    );
                    break;
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads ||
                        params.fee === undefined || !params.recipient || !params.messageBlobId || !params.auxId)
                        throw new Error("Missing parameters for Compound");
                    tx = await mintSuperMessageCompoundAndTransfer(
                        group.id, params.messageBlobId, params.auxId, params.timeFrom, params.timeTo,
                        params.maxReads, BigInt(params.fee), params.recipient,
                        {
                            tx,
                        }
                    );
                    break;
                case 'no_policy':
                    if (!params.messageBlobId || !params.auxId)
                        throw new Error("Missing parameters for No Policy");
                    tx = await mintSuperMessageNoPolicyAndTransfer(group.id, params.messageBlobId, params.auxId, {
                        tx,
                    });
                    break;
                default:
                    const exhaustiveCheck: never = params.type;
                    throw new Error(`Unknown message type for minting: ${exhaustiveCheck}`);
            }

            if (!tx) throw new Error("Transaction block generation failed");

            const { digest, effects } = await signAndExecuteTransaction({ transaction: tx });
            const { events } = await suiClient.waitForTransaction({ digest, options: { showEvents: true } });

            if (events) {
                const superMsgMintedEvent = events.find(
                    e => e.type === `${client.getPackageConfig().chatiwalId}::events::SuperMessageMinted`
                );

                if (superMsgMintedEvent) {
                    const parsedJson = superMsgMintedEvent.parsedJson as { id: string, group_id: string };
                    await addSuperMessage(parsedJson.id, parsedJson.group_id);

                    return {
                        id: parsedJson.id,
                        type: MessageType.SUPER_MESSAGE,
                        groupId: parsedJson.group_id,
                        auxId: Array.from(params.auxId),
                        content: new Uint8Array(),
                        blobId: params.messageBlobId,
                        createdAt: Math.floor(Date.now() / 1000).toString(),
                        feeCollected: { value: "0" },
                        owner: currentAccount?.address,
                        readers: [],
                    } as TMessage;
                }
            }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });
            toaster.success({ title: "Success", description: "Super message minted successfully" });
            if (data) {
                publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encode(data));
            }
            resetMutation();
            resetForm();
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
            toaster.error({
                title: "Minting Error",
                description: error instanceof Error ? error.message : "Failed to mint super message"
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
        mode: "onChange",
        defaultValues: {
            messageType: 'no_policy',
            contentAsFiles: [],
            contentAsText: '',
            timeFrom: Math.floor(Date.now() / 1000),
            timeTo: Math.floor(Date.now() / 1000) + 86400,
            maxReads: 1,
            fee: 0,
            recipient: currentAccount?.address ?? '',
        },
    });

    const messageType = watch('messageType');

    const onSendSubmit = useCallback(async (data: FormValues) => {
        if (!currentAccount || !group?.id) {
            toaster.error({ title: "Error", description: "Not connected or group not found." });
            return;
        }

        if (!data.contentAsText && data.contentAsFiles.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot send an empty message.", duration: 2000 });
            return;
        }

        try {
            const { messageToEncrypt, auxId } = await createMessageFromContent(
                currentAccount,
                channelType,
                channelName,
                group.id,
                data
            );

            messageToEncrypt.content = await encrypt(auxId, messageToEncrypt.content, { type: channelType });
            publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encode(messageToEncrypt));
            resetForm();
        } catch (error: any) {
            console.error(error);
            toaster.error({
                title: "Send Error",
                description: `Failed to encrypt or send message: ${error?.message ?? 'Unknown error'}`
            });
        }
    }, [currentAccount, group, encrypt, publish, resetForm, channelType, channelName]);

    const onMintSubmit = async (data: FormValues) => {
        if (!currentAccount || !group?.id) {
            toaster.error({ title: "Error", description: "Not connected or group not found." });
            return;
        }

        if (!data.contentAsText && data.contentAsFiles.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot mint an empty message.", duration: 2000 });
            return;
        }

        const auxId = generateContentId(moduleMessagePrefix);
        const mediaContentAsText = { id: nanoid(), mimeType: "text/plain", raw: data.contentAsText } satisfies MediaContent;
        const fileProcessingPromises = data.contentAsFiles.map(file => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            return new Promise<MediaContent>((resolve, reject) => {
                reader.onload = () => resolve({
                    id: nanoid(),
                    mimeType: file.type,
                    raw: new Uint8Array(reader.result as ArrayBuffer),
                });
                reader.onerror = (e) => reject(e);
            });
        });

        try {
            const resolvedMediaContentFiles = await Promise.all(fileProcessingPromises);
            const finalDataStructure: MediaContent[] = [mediaContentAsText, ...resolvedMediaContentFiles]
                .filter(mc => mc.raw && (typeof mc.raw === 'string' ? mc.raw.length > 0 : mc.raw.length > 0));

            let encryptedResult = await encrypt(auxId, encode(finalDataStructure));

            const { blobId, transaction } = await storeReturnTransaction(encryptedResult);
            if (!blobId) throw new Error("Failed to store message, received undefined blobId.");


            const baseParams: { type: SuperMessageType, groupId: string, messageBlobId: string, auxId: Uint8Array, tx: Transaction } = {
                type: data.messageType,
                groupId: group.id,
                messageBlobId: blobId,
                auxId,
                tx: transaction
            };

            let finalParams: MintParams;

            switch (data.messageType) {
                case 'time_lock':
                    if (data.timeFrom === undefined || data.timeTo === undefined || data.timeFrom >= data.timeTo)
                        throw new Error("Valid time parameters required (End > Start)");
                    finalParams = {
                        ...baseParams,
                        timeFrom: BigInt(data.timeFrom * 1000), // Convert to milliseconds
                        timeTo: BigInt(data.timeTo * 1000), // Convert to milliseconds
                    };
                    break;
                case 'limited_read':
                    if (data.maxReads === undefined || data.maxReads < 1)
                        throw new Error("Valid maxReads required (>= 1)");
                    finalParams = {
                        ...baseParams,
                        maxReads: BigInt(data.maxReads)
                    };
                    break;
                case 'fee_based':
                    if (data.fee === undefined || data.fee < 0 || !data.recipient)
                        throw new Error("Valid fee (>= 0) and recipient required");
                    finalParams = {
                        ...baseParams,
                        fee: BigInt(Math.floor(data.fee * 10 ** SUI_DECIMALS)),
                        recipient: data.recipient
                    };
                    break;
                case 'compound':
                    if (data.timeFrom === undefined || data.timeTo === undefined || data.timeFrom >= data.timeTo ||
                        data.maxReads === undefined || data.maxReads < 1 ||
                        data.fee === undefined || data.fee < 0 || !data.recipient)
                        throw new Error("Valid parameters required for Compound policy");

                    finalParams = {
                        ...baseParams,
                        timeFrom: BigInt(data.timeFrom * 1000),
                        timeTo: BigInt(data.timeTo * 1000),
                        maxReads: BigInt(data.maxReads),
                        fee: BigInt(Math.floor(data.fee * 10 ** SUI_DECIMALS)),
                        recipient: data.recipient
                    };
                    break;
                case 'no_policy':
                    finalParams = { ...baseParams };
                    break;
                default:
                    const exhaustiveCheck: never = data.messageType;
                    throw new Error(`Unknown message type: ${exhaustiveCheck}`);
            }

            mintSuperMessage(finalParams);
        } catch (error) {
            console.error("Pre-mutation parameter error:", error);
            toaster.error({
                title: "Parameter Error",
                description: error instanceof Error ? error.message : "Invalid input values for minting",
            });
        }
    };

    const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(onSendSubmit)();
        }
    };

    const renderSpecificInputs = () => {
        const inputStackProps = { gap: 2, w: "full" };
        const timeFromValue = getValues("timeFrom");
        const minEndDate = timeFromValue ? new Date(timeFromValue * 1000) : new Date(); // Prevent end date being before start date

        switch (messageType) {
            case 'time_lock':
                return (
                    <HStack {...inputStackProps}>
                        {renderDatePickerField("timeFrom", "Start Time", control, isPending, isSubmitting)}
                        {renderDatePickerField(
                            "timeTo",
                            "End Time",
                            control,
                            isPending,
                            isSubmitting,
                            minEndDate,
                            {
                                required: true,
                                validate: (v: number) => v > timeFromValue || "End > Start"
                            }
                        )}
                    </HStack>
                );
            case 'limited_read':
                return (
                    <Stack {...inputStackProps}>
                        {renderNumberField("maxReads", "Max Reads", control, isPending, isSubmitting, undefined, 1)}
                    </Stack>
                );
            case 'fee_based':
                return (
                    <HStack align="start" {...inputStackProps}>
                        {renderNumberField("fee", "Fee", control, isPending, isSubmitting, "SUI", 0)}
                        {renderTextField(
                            "recipient",
                            "Recipient",
                            "0x...",
                            control,
                            isPending,
                            isSubmitting,
                            "3",
                            {
                                required: true,
                                pattern: {
                                    value: /^0x[a-fA-F0-9]{64}$/,
                                    message: "Invalid Sui address"
                                }
                            },
                            false
                        )}
                    </HStack>
                );
            case 'compound':
                return (
                    <Stack {...inputStackProps}>
                        <HStack w="full" align="start">
                            <HStack w="full">
                                {renderDatePickerField("timeFrom", "Start Time", control, isPending, isSubmitting)}
                                {renderDatePickerField(
                                    "timeTo",
                                    "End Time",
                                    control,
                                    isPending,
                                    isSubmitting,
                                    minEndDate,
                                    {
                                        required: true,
                                        validate: (v: number) => v > timeFromValue || "End > Start"
                                    }
                                )}
                            </HStack>
                        </HStack>
                        {renderNumberField("maxReads", "Max Reads", control, isPending, isSubmitting, undefined, 1)}
                        <HStack w="full" align="start">
                            {renderNumberField("fee", "Fee", control, isPending, isSubmitting, "SUI", 0)}
                            {renderTextField(
                                "recipient",
                                "Recipient",
                                "0x...",
                                control,
                                isPending,
                                isSubmitting,
                                "3",
                                {
                                    required: true,
                                    pattern: {
                                        value: /^0x[a-fA-F0-9]{64}$/,
                                        message: "Invalid Sui address"
                                    }
                                }
                            )}
                        </HStack>
                    </Stack>
                );
            default:
                return null;
        }
    };

    const policies = createListCollection({
        items: [
            { label: "No Policy", description: "Standard message, no access policy", value: "no_policy" as SuperMessageType },
            { label: "Time Lock", description: "Access only within time window", value: "time_lock" as SuperMessageType },
            { label: "Limited Read", description: "Limit total message reads", value: "limited_read" as SuperMessageType },
            { label: "Fee Based", description: "Pay fee to access message", value: "fee_based" as SuperMessageType },
            { label: "Compound", description: "Combine multiple rules", value: "compound" as SuperMessageType },
        ]
    });

    return (
        <VStack
            w="full"
            p="2"
            bg="bg.200"
            shadow="custom.sm" rounded="3xl"
            border={"1px solid"} borderColor={"bg.300"}
            alignItems="stretch" {...props}
        >
            <HStack align="center" justify={"space-between"} gap={"1"}>
                <HStack flex={1} align="start">
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
                                    disabled={isPending || isSubmitting}
                                    collection={policies}
                                    value={[field.value]}
                                    onValueChange={({ value }) => {
                                        if (value && value.length > 0) field.onChange(value[0]);
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
            </HStack>

            {renderSpecificInputs()}

            <VStack
                pos="relative" gap={0}
                rounded="3xl"
            >
                <Controller
                    name="contentAsText"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            placeholder="Type your message here..."
                            onKeyDown={handleTextareaKeyDown}
                            {...field}
                        />
                    )}
                />
                <HStack pos="sticky" direction="row" gap={"2"} justify={"space-between"} alignItems="flex-end" w={"full"}>
                    <Controller
                        name="contentAsFiles"
                        control={control}
                        render={({ field }) => (
                            <MediaInput
                                onFileAccept={(d) => field.onChange(d.files)}
                                formFiles={field.value}
                            />
                        )}
                    />
                    <Button
                        type="button"
                        onClick={handleSubmit(onMintSubmit)}
                        colorPalette="primary"
                        loading={isPending || isSubmitting}
                        loadingText="Minting..."
                        size="sm"
                        disabled={isPending || isSubmitting || !group?.id}
                    >
                        <FaSuperpowers style={{ marginRight: '0.5em' }} />
                        Mint Message
                    </Button>
                </HStack>
            </VStack>
            {isError && (<Text color="red.500" fontSize="xs"> {error?.message} </Text>)}
        </VStack>
    );
}

export function ComposerInputForDirectMessage({ messages, ...props }: ComposerInputForDirectMessageProps) {
    const { channelName } = useChannelName();
    const { id } = useDirectMessageId();
    const { publish } = useChannel({ channelName });
    const currentAccount = useCurrentAccount();
    const ably = useAbly();
    const { encrypt } = useSealClient();
    const { addMessage } = useMessageStore();
    const inboxChannel = ably.channels.get(AblyChannelManager.getChannel("INBOX", id))

    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
        reset: resetForm,
    } = useForm<FormValues>({
        mode: "onChange",
        defaultValues: {
            messageType: 'no_policy',
            contentAsFiles: [],
            contentAsText: '',
            timeFrom: Math.floor(Date.now() / 1000),
            timeTo: Math.floor(Date.now() / 1000) + 86400,
            maxReads: 1,
            fee: 0,
            recipient: currentAccount?.address ?? '',
        },
    });

    const onSendSubmit = useCallback(async (data: FormValues) => {
        if (!currentAccount) {
            toaster.error({ title: "Error", description: "Not connected." });
            return;
        }

        if (!data.contentAsText && data.contentAsFiles.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot send an empty message.", duration: 2000 });
            return;
        }

        try {
            const { messageToEncrypt, auxId } = await createMessageFromContent(
                currentAccount,
                MessageType.DIRECT,
                channelName,
                undefined,
                data
            );



            messageToEncrypt.content = await encrypt(auxId, messageToEncrypt.content, {
                type: MessageType.DIRECT,
            });

            addMessage(channelName, messageToEncrypt);
            publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encode(messageToEncrypt));
            inboxChannel.publish(AblyChannelManager.EVENTS.NOTIFICATION_RECEIVED, '');
            resetForm();
        } catch (error: any) {
            console.error(error);
            toaster.error({
                title: "Send Error",
                description: `Failed to encrypt or send message: ${error?.message ?? 'Unknown error'}`
            });
        }
    }, [currentAccount, channelName, encrypt, publish, resetForm]);

    const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(onSendSubmit)();
        }
    };

    return (
        <VStack
            w="full"
            p="2"
            bg="bg.200"
            backdropFilter="blur(12px)"
            shadow="custom.sm" rounded="3xl"
            border={"1px solid"} borderColor={"bg.300"}
            alignItems="stretch" {...props}
        >
            <VStack
                pos="relative" gap={0}
                rounded="3xl"
            >
                <Controller
                    name="contentAsText"
                    control={control}
                    render={({ field }) => (
                        <TextInput
                            placeholder="Type your message here..."
                            onKeyDown={handleTextareaKeyDown}
                            {...field}
                        />
                    )}
                />
                <HStack pos="sticky" p={"2"} direction="row" gap={"2"} justify={"space-between"} alignItems="flex-end" w={"full"}>
                    <Controller
                        name="contentAsFiles"
                        control={control}
                        render={({ field }) => (
                            <MediaInput
                                onFileAccept={(d) => field.onChange(d.files)}
                                formFiles={field.value}
                            />
                        )}
                    />
                </HStack>
            </VStack>
        </VStack>
    );
}