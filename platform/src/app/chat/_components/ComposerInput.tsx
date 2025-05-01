"use client";

import { useCallback, useState, useMemo } from "react";
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

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
    Center,
    Flex,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { encode } from "@msgpack/msgpack";

import { useGroup } from "../_hooks/useGroupId";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";
import { MediaContent, TMessage } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { useSealClient } from "@/hooks/useSealClient";
import { MediaInput, TextInput } from "./MessageInput";
import { DatePickerInput } from "@/components/ui/date-picker";
import { nanoid } from "nanoid";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { HiKey } from "react-icons/hi";
import { useChannel } from "ably/react";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { generateContentId } from "@/libs";
import { fromHex, SUI_DECIMALS } from "@mysten/sui/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { SessionKey } from "@mysten/seal";
import { useSupabase } from "@/hooks/useSupabase";
import { MessagesSnapshotButton } from "./MessagesSnapshotButton";

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

interface ComposerInputProps extends StackProps {
    messages?: TMessage[];
    messageInputProps: {
        channelName: string;
        onMessageSend: (plainMessage: TMessage) => void;
    };
    onMessageMinted?: (message: any) => void;
}

export function ComposerInput({ messageInputProps, ...props }: ComposerInputProps) {
    const { channelName, onMessageSend } = messageInputProps;
    const { publish } = useChannel({ channelName });
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
    } = useChatiwalClient();
    const { setSessionKey, getSessionKey, sessionKeys } = useSessionKeys();
    const { encrypt, encryptMessage, createSessionKey } = useSealClient();
    const { store } = useWalrusClient();
    const { client } = useChatiwalClient();
    const { addSuperMessage } = useSupabase();

    const [isSelectExpanded, setIsSelectExpanded] = useState(false);
    const currentSessionKey = useMemo<SessionKey | null>(() => {
        let s = getSessionKey(group.id);
        if (!s || !(s instanceof SessionKey)) return null;
        return s;
    }, [currentAccount, group, getSessionKey, sessionKeys]);

    const { mutate: mintSuperMessage, isPending, isError, error, reset: resetMutation } = useMutation({
        mutationFn: async (params: MintParams) => {
            if (!group?.id) throw new Error("Group ID is not available");

            let tx: Transaction;
            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo || !params.messageBlobId || !params.auxId) throw new Error("Missing parameters for Time Lock");
                    tx = await mintSuperMessageTimeLockAndTransfer(group.id, params.messageBlobId, params.auxId, params.timeFrom, params.timeTo);
                    break;
                case 'limited_read':
                    if (!params.maxReads || !params.messageBlobId || !params.auxId) throw new Error("Missing parameters for Limited Read");
                    tx = await mintSuperMessageLimitedReadAndTransfer(group.id, params.messageBlobId, params.auxId, params.maxReads);
                    break;
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient) throw new Error("Missing parameters for Fee Based");
                    tx = await mintSuperMessageFeeBasedAndTransfer(group.id, params.messageBlobId, params.auxId, BigInt(params.fee), params.recipient);
                    break;
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads || params.fee === undefined || !params.recipient || !params.messageBlobId || !params.auxId) throw new Error("Missing parameters for Compound");
                    tx = await mintSuperMessageCompoundAndTransfer(group.id, params.messageBlobId, params.auxId, params.timeFrom, params.timeTo, params.maxReads, BigInt(params.fee), params.recipient);
                    break;
                case 'no_policy':
                    if (!params.messageBlobId || !params.auxId) throw new Error("Missing parameters for No Policy");
                    tx = await mintSuperMessageNoPolicyAndTransfer(group.id, params.messageBlobId, params.auxId);
                    break;
                default:
                    const exhaustiveCheck: never = params.type;
                    throw new Error(`Unknown message type for minting: ${exhaustiveCheck}`);
            }
            if (!tx) throw new Error("Transaction block generation failed");

            let { digest, effects } = await signAndExecuteTransaction({ transaction: tx });

            const { events } = await suiClient.waitForTransaction({ digest });

            if (events) {
                const superMsgMintedEvent = events.find((e) => e.type === `${client.getPackageConfig().chatiwalId}::events::SuperMessageMinted`);
                if (superMsgMintedEvent) {
                    const parsedJson = superMsgMintedEvent.parsedJson as { id: string, group_id: string };
                    await addSuperMessage(parsedJson.id, parsedJson.group_id);
                }
            }

            return { digest };
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });
            toaster.success({ title: "Success", description: "Super message minted successfully" });
            if (onMessageMinted) onMessageMinted(data);
            resetMutation();
            resetForm();
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
            toaster.error({ title: "Minting Error", description: error instanceof Error ? error.message : "Failed to mint super message" });
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


    const handleCreateGroupKey = async () => {
        if (!currentAccount) {
            toaster.error({ title: "Error", description: "Not connected." });
            return;
        }
        if (!group?.id) {
            toaster.error({ title: "Error", description: "Group not loaded." });
            return;
        }
        try {
            const groupKey = await createSessionKey();
            setSessionKey(group.id, groupKey);
            toaster.success({ title: "Success", description: "Group key created successfully" });
        } catch (error) {
            toaster.error({ title: "Key Creation Error", description: error instanceof Error ? error.message : "Failed to create group key" });
        }
    };

    const onSendSubmit = useCallback(async (data: FormValues) => {
        if (!currentAccount || !group?.id) {
            toaster.error({ title: "Error", description: "Not connected or group not found." });
            return;
        }

        const textToSend = data.contentAsText;
        const filesToSend = data.contentAsFiles;

        if (!textToSend && filesToSend.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot send an empty message.", duration: 2000 });
            return;
        }

        if (!currentAccount) throw new Error("Not connected");
        if (!group?.id) throw new Error("Group not loaded");

        const plainMessageId = nanoid();
        const auxId = generateContentId(fromHex(group.id));
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


        const resolvedMediaContentFiles = await Promise.all(fileProcessingPromises);
        const finalDataStructure: MediaContent[] = [mediaContentAsText, ...resolvedMediaContentFiles].filter(mc => mc.raw && (typeof mc.raw === 'string' ? mc.raw.length > 0 : mc.raw.length > 0));
        const encodedUint8Array: Uint8Array = encode(finalDataStructure);



        // Create a structure suitable for encryptMessage
        const messageToEncrypt = {
            id: plainMessageId,
            owner: currentAccount.address,
            groupId: group.id,
            auxId: Array.from(auxId),
            content: encodedUint8Array,
            readers: [],
            feeCollected: {
                value: "0",
            },
            createdAt: Math.floor(Date.now() / 1000).toString(),
        } satisfies TMessage;

        onMessageSend(messageToEncrypt);

        try {
            const encryptedResult = await encryptMessage(messageToEncrypt);

            await publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encode(encryptedResult));
            resetForm();

        } catch (error: any) {
            console.error(error);
            toaster.error({ title: "Send Error", description: `Failed to encrypt or send message: ${error?.message ?? 'Unknown error'}` });
        }

    }, [currentAccount, group, onMessageSend, encryptMessage, publish, resetForm]);

    const onMintSubmit = async (data: FormValues) => {
        if (!currentAccount || !group?.id) {
            toaster.error({ title: "Error", description: "Not connected or group not found." });
            return;
        }
        if (!data.contentAsText && data.contentAsFiles.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot mint an empty message.", duration: 2000 });
            return;
        }

        const textToSend = data.contentAsText;
        const filesToSend = data.contentAsFiles;

        if (!textToSend && filesToSend.length === 0) {
            toaster.warning({ title: "Empty Message", description: "Cannot send an empty message.", duration: 2000 });
            return;
        }

        if (!currentAccount) throw new Error("Not connected");
        if (!group?.id) throw new Error("Group not loaded");

        const auxId = generateContentId(fromHex(group.id));
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


        const resolvedMediaContentFiles = await Promise.all(fileProcessingPromises);
        const finalDataStructure: MediaContent[] = [mediaContentAsText, ...resolvedMediaContentFiles].filter(mc => mc.raw && (typeof mc.raw === 'string' ? mc.raw.length > 0 : mc.raw.length > 0));

        let encryptedResult = await encrypt(auxId, encode(finalDataStructure));
        let blobId: string | undefined;

        try {
            blobId = await store(encryptedResult);
            if (!blobId) throw new Error("Failed to store message, received undefined blobId.");
        } catch (storeError: any) {
            toaster.error({ title: "Storage Error", description: storeError?.message ?? 'Failed to store message' });
            return;
        }

        try {
            const baseParams: { type: SuperMessageType, groupId: string, messageBlobId: string, auxId: Uint8Array } = {
                type: data.messageType,
                groupId: group.id,
                messageBlobId: blobId,
                auxId
            };

            let finalParams: MintParams;

            switch (data.messageType) {
                case 'time_lock':
                    if (data.timeFrom === undefined || data.timeTo === undefined || data.timeFrom >= data.timeTo) throw new Error("Valid time parameters required (End > Start)");
                    finalParams = { ...baseParams, timeFrom: BigInt(data.timeFrom), timeTo: BigInt(data.timeTo) };
                    break;
                case 'limited_read':
                    if (data.maxReads === undefined || data.maxReads < 1) throw new Error("Valid maxReads required (>= 1)");
                    finalParams = { ...baseParams, maxReads: BigInt(data.maxReads) };
                    break;
                case 'fee_based':
                    if (data.fee === undefined || data.fee < 0 || !data.recipient) throw new Error("Valid fee (>= 0) and recipient required");
                    finalParams = { ...baseParams, fee: BigInt(Math.floor(data.fee * 10 ** SUI_DECIMALS)), recipient: data.recipient };
                    break;
                case 'compound':
                    if (data.timeFrom === undefined || data.timeTo === undefined || data.timeFrom >= data.timeTo || data.maxReads === undefined || data.maxReads < 1 || data.fee === undefined || data.fee < 0 || !data.recipient) throw new Error("Valid parameters required for Compound policy");
                    finalParams = { ...baseParams, timeFrom: BigInt(data.timeFrom), timeTo: BigInt(data.timeTo), maxReads: BigInt(data.maxReads), fee: BigInt(Math.floor(data.fee * 10 ** SUI_DECIMALS)), recipient: data.recipient };
                    break;
                case 'no_policy':
                    finalParams = { ...baseParams };
                    break;
                default:
                    const exhaustiveCheck: never = data.messageType;
                    throw new Error(`Unknown message type: ${exhaustiveCheck}`);
            }
            console.log("Final params for minting:", finalParams);
            mintSuperMessage(finalParams);
        } catch (error) {
            console.error("Pre-mutation parameter error:", error);
            toaster.error({
                title: "Parameter Error",
                description: error instanceof Error ? error.message : "Invalid input values for minting",
            });
        }
    };


    const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(onSendSubmit)();
        }
    };

    const renderDatePickerField = (name: "timeFrom" | "timeTo", label: string, minDate?: Date, validation?: any) => (
        <Controller
            name={name}
            control={control}
            rules={validation || { required: `${label} is required` }}
            render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error} width="50%">
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <DatePicker
                        selected={field.value ? new Date(field.value * 1000) : new Date()}
                        onChange={(date: Date | null) => field.onChange(date ? Math.floor(date.getTime() / 1000) : new Date())} // Set undefined on clear
                        onBlur={field.onBlur}
                        customInput={<DatePickerInput w="full" />}
                        showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="yyyy-MM-dd HH:mm"
                        isClearable placeholderText={`Select ${label.toLowerCase()}`}
                        disabled={isPending || isSubmitting}
                        popperPlacement="top-start"
                        minDate={minDate}
                        filterTime={minDate && name === "timeTo" ? (time) => { const selectedDate = field.value ? new Date(field.value * 1000) : null; if (!minDate || !selectedDate || !time) return true; if (selectedDate.toDateString() === minDate.toDateString()) { return time.getTime() > minDate.getTime(); } return true; } : undefined}
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
            render={({ field: { onChange, onBlur, value, ref }, fieldState }) => (
                <Field.Root flex={name === "fee" ? "1" : undefined} w={name === "maxReads" ? "full" : undefined} invalid={!!fieldState.error} >
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <NumberInput.Root
                        w={name === "maxReads" || name === "fee" ? "full" : undefined}
                        variant="subtle" size="sm"
                        disabled={isPending || isSubmitting}
                        min={min}
                        value={String(value)}
                        step={name === "fee" ? 0.25 : 1}
                        onValueChange={(valNum) => onChange(valNum.valueAsNumber)}
                        onBlur={onBlur}
                        ref={ref}
                    >
                        {name === "maxReads" ? <NumberInput.Control /> : null}
                        <NumberInput.Input bg="bg.300" rounded="lg" />
                    </NumberInput.Root>
                    {helperText && <Field.HelperText color="fg.contrast">{helperText}</Field.HelperText>}
                    {fieldState.error && <Text fontSize="xs" color="red.500">{fieldState.error.message}</Text>}
                </Field.Root>
            )}
        />
    );
    const renderTextField = (name: "recipient", label: string, placeholder: string, flex: string, validation?: any, required?: boolean) => (
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
    const renderSpecificInputs = () => {
        const inputStackProps = { gap: 2, w: "full" };
        const timeFromValue = getValues("timeFrom");
        const minEndDate = timeFromValue ? new Date(timeFromValue * 1000) : new Date(); // Prevent end date being before start date

        switch (messageType) {
            case 'time_lock':
                return <HStack {...inputStackProps}>
                    {renderDatePickerField("timeFrom", "Start Time")}
                    {renderDatePickerField("timeTo", "End Time", minEndDate, { required: true, validate: (v: number) => v > timeFromValue || "End > Start" })}
                </HStack>;
            case 'limited_read':
                return <Stack {...inputStackProps}>
                    {renderNumberField("maxReads", "Max Reads", undefined, 1)}
                </Stack>;
            case 'fee_based':
                return <HStack align="start" {...inputStackProps}>
                    {renderNumberField("fee", "Fee", "SUI", 0)}
                    {renderTextField("recipient", "Recipient", "0x...", "3", { required: true, pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } }, false)}
                </HStack>;
            case 'compound':
                return <Stack {...inputStackProps}>
                    <HStack w="full" align="start">
                        <HStack w="full">
                            {renderDatePickerField("timeFrom", "Start Time")}
                            {renderDatePickerField("timeTo", "End Time", minEndDate, { required: true, validate: (v: number) => v > timeFromValue || "End > Start" })}
                        </HStack>
                        {renderNumberField("maxReads", "Max Reads", undefined, 1)}
                    </HStack>
                    <HStack w="full" align="start">
                        {renderNumberField("fee", "Fee", "Atomic units", 0)}
                        {renderTextField("recipient", "Recipient", "0x...", "3", { required: true, pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } })}
                    </HStack>
                </Stack>;
            default: return null;
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
            p="3"
            bg="bg.100/75"
            backdropFilter="blur(12px)" shadow="custom.sm" rounded="3xl" gap={3} alignItems="stretch" {...props}
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
                <Center flex={2}>
                    <MessagesSnapshotButton messages={props.messages} />
                </Center>
                <HStack flex={1} justify="end">
                    <Tooltip
                        content={
                            currentSessionKey && currentSessionKey instanceof SessionKey ?
                                currentSessionKey.isExpired() ? "Session key expired" : currentSessionKey.getAddress()
                                :
                                "Create group key"
                        }
                    >
                        <Button
                            size="sm"
                            onClick={handleCreateGroupKey}
                            colorPalette={currentSessionKey ? currentSessionKey?.isExpired() ? "red" : "green" : "default"}
                            variant="outline"
                        >
                            <HiKey />
                        </Button>
                    </Tooltip>
                </HStack>
            </HStack>

            {renderSpecificInputs()}

            <VStack
                pos="relative" gap={0} bg="bg.300"
                _focusWithin={{ outline: "1px solid", outlineColor: "fg", outlineOffset: "2px" }}
                p={2} rounded="3xl"
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
                <Controller
                    name="contentAsFiles"
                    control={control}
                    render={({ field }) =>
                        <MediaInput
                            onFileAccept={(d) => field.onChange(d.files)}
                            formFiles={field.value}
                        />}
                />

                <Stack pos="absolute" bottom="4" right="4" direction="row" gap={"2"} alignItems="flex-end">
                    <Button
                        type="button"
                        onClick={handleSubmit(onMintSubmit)}
                        colorPalette="primary"
                        loading={isPending || isSubmitting}
                        loadingText="Minting..."
                        size="sm"
                        disabled={isPending || isSubmitting || !group?.id} // Use isDisabled for Chakra Button
                    >
                        <FaSuperpowers style={{ marginRight: '0.5em' }} />
                        Mint Message
                    </Button>
                </Stack>
            </VStack>
            {isError && (<Text color="red.500" fontSize="xs"> {error?.message} </Text>)}

        </VStack>
    );
}