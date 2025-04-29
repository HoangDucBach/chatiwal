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
import { encode, decode } from "@msgpack/msgpack";

import { useGroup } from "../_hooks/useGroupId";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";
import { MediaContent, TMessageBase, TProtocolMessage } from "@/types";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MessageBase, MessageOptions, SuperMessageCompound, SuperMessageFeeBased, SuperMessageLimitedRead, SuperMessageNoPolicy, SuperMessageTimeLock } from "@/sdk";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useSealClient } from "@/hooks/useSealClient";
import { MediaInput, TextInput } from "./MessageInput";
import { useCallback, useState } from "react";
import { DatePickerInput } from "@/components/ui/date-picker";
import { nanoid } from "nanoid";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { HiKey } from "react-icons/hi";
import { useChannel } from "ably/react";
import { AblyChannelManager } from "@/libs/ablyHelpers";

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
        onMessageSend: (plainMessage: TMessageBase) => void;
    };
    onMessageMinted?: (message: any) => void;
}

export function ComposerInput({ messageInputProps, ...props }: ComposerInputProps) {
    const { channelName, onMessageSend } = messageInputProps;
    const { channel, publish } = useChannel({ channelName });
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
    const { setGroupKey } = useSessionKeys();
    const { encryptMessage, createGroupSessionKey } = useSealClient();
    const { storeMessage } = useWalrusClient();

    const [isSelectExpanded, setIsSelectExpanded] = useState(false);

    const { mutate: mintSuperMessage, isPending, isError, error, reset: resetMutation } = useMutation({
        mutationFn: async (params: MintParams) => {
            if (!group?.id) throw new Error("Group ID is not available");
            let tx;
            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo || !params.metadataBlobId) throw new Error("Missing parameters for Time Lock");
                    tx = await mintSuperMessageTimeLockAndTransfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
                    break;
                case 'limited_read':
                     if (!params.maxReads || !params.metadataBlobId) throw new Error("Missing parameters for Limited Read");
                     tx = await mintSuperMessageLimitedReadAndTransfer(group.id, params.metadataBlobId, params.maxReads);
                    break;
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient || !params.coinType || !params.metadataBlobId) throw new Error("Missing parameters for Fee Based");
                    tx = await mintSuperMessageFeeBasedAndTransfer(group.id, params.metadataBlobId, BigInt(params.fee), params.recipient, params.coinType);
                    break;
                case 'compound':
                     if (!params.timeFrom || !params.timeTo || !params.maxReads || params.fee === undefined || !params.recipient || !params.coinType || !params.metadataBlobId) throw new Error("Missing parameters for Compound");
                    tx = await mintSuperMessageCompoundAndTransfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo, params.maxReads, BigInt(params.fee), params.recipient, params.coinType);
                    break;
                case 'no_policy':
                     if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for No Policy");
                    tx = await mintSuperMessageNoPolicyAndTransfer(group.id, params.metadataBlobId);
                    break;
                 default:
                     throw new Error(`Unknown message type for minting: ${params.type}`);
            }
            if (!tx) throw new Error("Transaction block generation failed");

            let { digest } = await signAndExecuteTransaction({ transaction: tx });
            await suiClient.waitForTransaction({ digest });
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
        formState: { isSubmitting, errors, isValid },
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
            coinType: '0x2::sui::SUI',
        }
    });

    const messageType = watch('messageType');

    const createSuperMessage = async (data: FormValues): Promise<MessageBase> => {
        if (!currentAccount) throw new Error("Not connected");
        if (!group?.id) throw new Error("Group not loaded");

         const mediaContentAsText = { id: nanoid(), mimeType: "text/plain", raw: data.contentAsText } satisfies MediaContent;
         const fileProcessingPromises = data.contentAsFiles.map(file => {
             const reader = new FileReader();
             reader.readAsArrayBuffer(file);
             return new Promise<MediaContent>((resolve, reject) => {
                 reader.onload = () => resolve({ id: nanoid(), mimeType: file.type, raw: new Uint8Array(reader.result as ArrayBuffer) });
                 reader.onerror = (e) => reject(e);
             });
         });
        const resolvedMediaContentFiles = await Promise.all(fileProcessingPromises);
         const finalDataStructure: MediaContent[] = [mediaContentAsText, ...resolvedMediaContentFiles];
         const encodedUint8Array: Uint8Array = encode(finalDataStructure);

        const baseMessageProps: MessageOptions = {
            data: { content: encodedUint8Array, blobId: '' },
            groupId: group.id,
            owner: currentAccount.address,
        };

         switch (data.messageType) {
            case 'no_policy': return new SuperMessageNoPolicy(baseMessageProps);
            case 'limited_read': return new SuperMessageLimitedRead({ ...baseMessageProps, policy: { maxReads: BigInt(data.maxReads) } });
            case 'fee_based': return new SuperMessageFeeBased({ ...baseMessageProps, policy: { feeAmount: BigInt(data.fee), coinType: data.coinType, recipient: data.recipient } });
            case 'time_lock': return new SuperMessageTimeLock({ ...baseMessageProps, policy: { endTime: BigInt(data.timeTo), startTime: BigInt(data.timeFrom) } });
            case 'compound': return new SuperMessageCompound({
                ...baseMessageProps,
                feePolicy: { feeAmount: BigInt(data.fee), coinType: data.coinType, recipient: data.recipient },
                timeLock: { endTime: BigInt(data.timeTo), startTime: BigInt(data.timeFrom) },
                limitedRead: { maxReads: BigInt(data.maxReads) },
            });
            default: throw new Error(`Unknown message type: ${data.messageType}`);
        }
    };

    const handleCreateGroupKey = async () => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }
         if (!group?.id) {
             toaster.error({ title: "Error", description: "Group not loaded." });
             return;
         }
        try {
            const groupKey = await createGroupSessionKey(group.id);
            setGroupKey(group.id, groupKey);
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

        const mediaContentAsTextPlain = { id: nanoid(), mimeType: "text/plain", raw: textToSend } satisfies MediaContent;
        const fileProcessingPromisesPlain = filesToSend.map(file => {
             return Promise.resolve({ id: nanoid(), mimeType: file.type, raw: file.name });
        });
        const resolvedMediaContentFilesPlain = await Promise.all(fileProcessingPromisesPlain);
        const plainMessage: TMessageBase = {
            id: nanoid(),
            groupId: group.id,
            owner: currentAccount.address,
            content: [mediaContentAsTextPlain, ...resolvedMediaContentFilesPlain],
            timestamp: Date.now(),
            status: 'sending',
        };
        onMessageSend(plainMessage);

         const mediaContentAsTextActual = { id: nanoid(), mimeType: "text/plain", raw: textToSend } satisfies MediaContent;
         const fileProcessingPromisesActual = filesToSend.map(file => {
             const reader = new FileReader();
             reader.readAsArrayBuffer(file);
             return new Promise<MediaContent>((resolve, reject) => {
                 reader.onload = () => resolve({ id: nanoid(), mimeType: file.type, raw: new Uint8Array(reader.result as ArrayBuffer) });
                 reader.onerror = (e) => reject(e);
             });
         });
         const resolvedMediaContentFilesActual = await Promise.all(fileProcessingPromisesActual);
         const finalDataStructureActual: MediaContent[] = [mediaContentAsTextActual, ...resolvedMediaContentFilesActual];
         const encodedUint8Array: Uint8Array = encode(finalDataStructureActual);

        const messageBase = new MessageBase({
            data: { content: encodedUint8Array, blobId: '' },
            groupId: group.id,
            owner: currentAccount.address
        } as MessageOptions);

        try {
             const encryptedMessage = await encryptMessage(messageBase);
             const protocolMessage: TProtocolMessage = {
                 id: plainMessage.id,
                 groupId: messageBase.getGroupId(),
                 owner: messageBase.getOwner(),
                 content: new Uint8Array(encryptedMessage.getData().content),
                 timestamp: plainMessage.timestamp,
             };

             publish(AblyChannelManager.EVENTS.MESSAGE_SEND, protocolMessage);
             resetForm();

        } catch(error) {
            console.error("Encryption or Ably publish error:", error);
            toaster.error({ title: "Send Error", description: `Failed to encrypt or send message: ${error.message}`});
        }

    }, [currentAccount, group, onMessageSend, encryptMessage, publish, resetForm, setGroupKey]);

    const onMintSubmit = async (data: FormValues) => {
        if (!currentAccount || !group?.id) {
            toaster.error({ title: "Error", description: "Not connected or group not found." });
            return;
        }
         if (!data.contentAsText && data.contentAsFiles.length === 0) {
             toaster.warning({ title: "Empty Message", description: "Cannot mint an empty message.", duration: 2000 });
            return;
        }

        let message: MessageBase;
        try {
            message = await createSuperMessage(data);
        } catch (createError) {
             toaster.error({ title: "Creation Error", description: createError.message });
            return;
        }

        try {
            message = await encryptMessage(message);
        } catch (encError) {
             toaster.error({ title: "Encryption Error", description: encError.message });
             return;
        }

        let blobId: string | undefined;
        try {
             blobId = await storeMessage(message);
             if (!blobId) throw new Error("Failed to store message, received undefined blobId.");
        } catch (storeError) {
             toaster.error({ title: "Storage Error", description: storeError.message });
             return;
        }

        try {
            const params: Partial<MintParams> & { type: SuperMessageType, groupId: string, metadataBlobId: string } = {
                type: data.messageType,
                groupId: group.id,
                metadataBlobId: blobId,
            };

            switch (data.messageType) {
                case 'time_lock':
                     if (!data.timeFrom || !data.timeTo) throw new Error("Missing time parameters");
                    params.timeFrom = BigInt(data.timeFrom);
                    params.timeTo = BigInt(data.timeTo);
                    break;
                case 'limited_read':
                     if (!data.maxReads) throw new Error("Missing maxReads");
                    params.maxReads = BigInt(data.maxReads);
                    break;
                case 'fee_based':
                    if (data.fee === undefined || !data.recipient || !data.coinType) throw new Error("Missing parameters for Fee Based");
                    params.fee = BigInt(data.fee);
                    params.recipient = data.recipient;
                    params.coinType = data.coinType;
                    break;
                case 'compound':
                     if (!data.timeFrom || !data.timeTo || !data.maxReads || data.fee === undefined || !data.recipient || !data.coinType) throw new Error("Missing parameters for Compound");
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
                        selected={field.value ? new Date(field.value * 1000) : null}
                        onChange={(date: Date | null) => field.onChange(date ? Math.floor(date.getTime() / 1000) : 0)}
                        onBlur={field.onBlur}
                        customInput={<DatePickerInput w="full" />}
                        showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="yyyy-MM-dd HH:mm"
                        isClearable placeholderText={`Select ${label.toLowerCase()}`}
                        disabled={isPending || isSubmitting}
                        popperPlacement="top-start"
                        minDate={minDate}
                        filterTime={minDate && name === "timeTo" ? (time) => { if (!minDate || !field.value || !time) return true; const selectedDate = new Date(field.value * 1000); if (selectedDate.toDateString() === minDate.toDateString()) { return time.getTime() > minDate.getTime(); } return true; } : undefined}
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
            rules={{ required: `${label} is required`, min: { value: min, message: `Must be >= ${min}` }, valueAsNumber: true }}
            render={({ field: { onChange, onBlur, value, ref }, fieldState }) => (
                <Field.Root flex={name === "fee" ? "1" : undefined} w={name === "maxReads" ? "full" : undefined} invalid={!!fieldState.error} >
                    <Field.Label fontSize="sm">{label}</Field.Label>
                    <NumberInput.Root
                        w={name === "maxReads" || name === "fee" ? "full" : undefined}
                        variant="subtle" size="sm"
                        disabled={isPending || isSubmitting}
                        min={min}
                        value={value === undefined || isNaN(value) ? '' : String(value)}
                        onChange={(valStr, valNum) => onChange(isNaN(valNum) ? undefined : valNum)}
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
     const renderTextField = (name: "coinType" | "recipient", label: string, placeholder: string, flex: string, validation?: any) => (
        <Controller
            name={name}
            control={control}
            rules={validation || { required: `${label} is required` }}
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
     const renderSpecificInputs = () => {  const inputStackProps = { gap: 2, w: "full" }; switch (messageType) { case 'time_lock': return <HStack {...inputStackProps}>{renderDatePickerField("timeFrom", "Start Time")}{renderDatePickerField("timeTo", "End Time", getValues("timeFrom") ? new Date(getValues("timeFrom") * 1000) : undefined, { required: true, validate: v => v > getValues("timeFrom") || "End > Start" })}</HStack>; case 'limited_read': return <Stack {...inputStackProps}>{renderNumberField("maxReads", "Max Reads", undefined, 1)}</Stack>; case 'fee_based': return <HStack align="start" {...inputStackProps}>{renderNumberField("fee", "Fee", "Atomic units")}{renderTextField("coinType", "Coin Type", "0x2::sui::SUI", "2")}{renderTextField("recipient", "Recipient", "0x...", "3", { required: true, pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } })}</HStack>; case 'compound': return <Stack {...inputStackProps}><HStack w="full" align="start"><HStack w="full">{renderDatePickerField("timeFrom", "Start Time")}{renderDatePickerField("timeTo", "End Time", getValues("timeFrom") ? new Date(getValues("timeFrom") * 1000) : undefined, { required: true, validate: v => v > getValues("timeFrom") || "End > Start" })}</HStack>{renderNumberField("maxReads", "Max Reads", undefined, 1)}</HStack><HStack w="full" align="start">{renderNumberField("fee", "Fee", "Atomic units")}{renderTextField("coinType", "Coin Type", "0x2::sui::SUI", "2")}{renderTextField("recipient", "Recipient", "0x...", "3", { required: true, pattern: { value: /^0x[a-fA-F0-9]{64}$/, message: "Invalid Sui address" } })}</HStack></Stack>; default: return null; } };
     const policies = createListCollection({ items: [ { label: "No Policy", description: "Standard message, no access policy", value: "no_policy" as SuperMessageType }, { label: "Time Lock", description: "Access only within time window", value: "time_lock" as SuperMessageType }, { label: "Limited Read", description: "Limit total message reads", value: "limited_read" as SuperMessageType }, { label: "Fee Based", description: "Pay fee to access message", value: "fee_based" as SuperMessageType }, { label: "Compound", description: "Combine multiple rules", value: "compound" as SuperMessageType }, ] });

    return (
        <VStack
            w="full"
            p="3"
            bg="bg.100/75"
             backdropBlur="2xl" shadow="custom.sm" rounded="3xl" gap={3} alignItems="stretch" {...props}
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
                                disabled={isPending || isSubmitting}
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
                 <Button size="sm" onClick={handleCreateGroupKey} variant="outline" ml="auto"><HiKey /></Button>
            </HStack>

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
                            onKeyDown={handleTextareaKeyDown}
                            {...field}
                        />
                    )}
                />
                <Controller
                    name="contentAsFiles"
                    control={control}
                    render={({ field }) => ( <MediaInput {...field} onFileAccept={(d) => field.onChange(d.files)}/> )}
                />

                <Stack pos="absolute" bottom="4" right="4" direction="row" gap={"2"} alignItems="flex-end">
                    {isError && ( <Text color="red.500" fontSize="xs"> Minting Error: {error?.message} </Text> )}
                    <Button
                        type="button"
                        onClick={handleSubmit(onMintSubmit)}
                        colorPalette="primary"
                        isLoading={isPending || isSubmitting}
                        loadingText="Minting..."
                        size="sm"
                        disabled={isPending || isSubmitting || !group?.id}
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