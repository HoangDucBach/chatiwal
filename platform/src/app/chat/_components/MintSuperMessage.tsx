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
import { SuperMessageFeeBased, SuperMessageLimitedRead, SuperMessageNoPolicy, SuperMessageTimeLock } from "@/sdk";

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
    metadataBlobId: string;
    timeFrom: number;
    timeTo: number;
    maxReads: number;
    fee: number;
    recipient: string;
    coinType: string;
}

interface Props extends ButtonProps { }
// export function MintSuperMessage(props: Props) {
//     const { group } = useGroup();
//     const queryClient = useQueryClient();
//     const { open, onClose, setOpen } = useDisclosure();
//     const contentRef = useRef<HTMLDivElement>(null);

//     const {
//         mint_super_message_time_lock_and_transfer,
//         mint_super_message_no_policy_and_transfer,
//         mint_super_message_fee_based_and_transfer,
//         mint_super_message_limited_read_and_transfer,
//         mint_super_message_compound_and_transfer,
//     } = useChatiwalClient();

//     const {
//         handleSubmit,
//         control,
//         watch,
//         formState: { errors },
//         reset: resetForm
//     } = useForm<FormValues>({
//         defaultValues: {
//             messageType: 'time_lock',
//             metadataBlobId: '',
//             timeFrom: Math.floor(Date.now() / 1000),
//             timeTo: Math.floor(Date.now() / 1000) + 86400,
//             maxReads: 1,
//             fee: 0,
//             recipient: '',
//             coinType: '0x2::sui::SUI',
//         }
//     });

//     const messageType = watch('messageType');

//     const { mutate: mintSuperMessage, isPending, isError, error, reset } = useMutation({
//         mutationFn: async (params: MintParams) => {
//             console.log("Mutation function called with:", params);

//             switch (params.type) {
//                 case 'time_lock':
//                     if (!params.timeFrom || !params.timeTo) throw new Error("Missing time parameters for Time Lock");
//                     return mint_super_message_time_lock_and_transfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
//                 case 'limited_read':
//                     if (!params.maxReads) throw new Error("Missing maxReads for Limited Read");
//                     return mint_super_message_limited_read_and_transfer(group.id, params.metadataBlobId, params.maxReads);
//                 case 'fee_based':
//                     if (!params.fee || !params.recipient || !params.coinType) throw new Error("Missing parameters for Fee Based");
//                     return mint_super_message_fee_based_and_transfer(group.id, params.metadataBlobId, params.fee, params.recipient, params.coinType);
//                 case 'compound':
//                     if (!params.timeFrom || !params.timeTo || !params.maxReads || !params.fee || !params.recipient || !params.coinType)
//                         throw new Error("Missing parameters for Compound");
//                     return mint_super_message_compound_and_transfer(
//                         group.id,
//                         params.metadataBlobId,
//                         params.timeFrom,
//                         params.timeTo,
//                         params.maxReads,
//                         params.fee,
//                         params.recipient,
//                         params.coinType
//                     );
//                 case 'no_policy':
//                     return mint_super_message_no_policy_and_transfer(group.id, params.metadataBlobId);
//                 default:
//                     throw new Error(`Unknown message type: ${params.type}`);
//             }
//         },
//         onSuccess: (data, variables) => {
//             console.log('Mutation successful:', data);
//             queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });

//             toaster.success({
//                 title: "Success",
//                 description: "Super message minted successfully",
//                 duration: 5000,
//             });

//             onClose();
//         },
//         onError: (error) => {
//             console.error('Mutation failed:', error);
//             toaster.error({
//                 title: "Error",
//                 description: error.message || "Failed to mint super message",
//                 duration: 5000,
//             });
//         },
//     });

//     useEffect(() => {
//         if (!open) {
//             reset();
//             resetForm();
//         }
//     }, [open, reset, resetForm]);

//     const onSubmit = (data: FormValues) => {
//         try {
//             const params: Partial<MintParams> = {
//                 type: data.messageType,
//                 groupId: data.groupId,
//                 metadataBlobId: data.metadataBlobId,
//             };

//             switch (data.messageType) {
//                 case 'time_lock':
//                     params.timeFrom = BigInt(data.timeFrom);
//                     params.timeTo = BigInt(data.timeTo);
//                     break;
//                 case 'limited_read':
//                     params.maxReads = BigInt(data.maxReads);
//                     break;
//                 case 'fee_based':
//                     params.fee = BigInt(data.fee);
//                     params.recipient = data.recipient;
//                     params.coinType = data.coinType;
//                     break;
//                 case 'compound':
//                     params.timeFrom = BigInt(data.timeFrom);
//                     params.timeTo = BigInt(data.timeTo);
//                     params.maxReads = BigInt(data.maxReads);
//                     params.fee = BigInt(data.fee);
//                     params.recipient = data.recipient;
//                     params.coinType = data.coinType;
//                     break;
//             }

//             mintSuperMessage(params as MintParams);
//         } catch (error) {
//             console.error("Pre-mutation validation error:", error);
//             toaster.error({
//                 title: "Validation Error",
//                 description: error instanceof Error ? error.message : "Invalid input values",
//                 duration: 5000,
//             });
//         }
//     };

//     const renderSpecificInputs = () => {
//         switch (messageType) {
//             case 'time_lock':
//                 return (
//                     <>
//                         <Controller
//                             name="timeFrom"
//                             control={control}
//                             rules={{ required: "Time From is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.timeFrom} required>
//                                     <Field.Label>Time From (Unix Timestamp)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />
//                                     </NumberInput.Root>
//                                     <Text>{errors.timeFrom?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="timeTo"
//                             control={control}
//                             rules={{ required: "Time To is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.timeTo} required>
//                                     <Field.Label>Time To (Unix Timestamp)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />
//                                     </NumberInput.Root>
//                                     <Text>{errors.timeTo?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />
//                     </>
//                 );

//             case 'limited_read':
//                 return (
//                     <Controller
//                         name="maxReads"
//                         control={control}
//                         rules={{ required: "Max Reads is required", min: { value: 1, message: "Must be at least 1" } }}
//                         render={({ field }) => (
//                             <Field.Root invalid={!!errors.maxReads} required>
//                                 <Field.Label>Max Reads</Field.Label>
//                                 <NumberInput.Root
//                                     disabled={isPending}
//                                     min={1}
//                                     value={field.value.toString()}
//                                     onChange={(value) => field.onChange(value)}
//                                 >
//                                     <NumberInput.Control />
//                                     <NumberInput.Input onBlur={field.onBlur} />
//                                 </NumberInput.Root>
//                                 <Text>{errors.maxReads?.message}</Text>
//                             </Field.Root>
//                         )}
//                     />
//                 );

//             case 'fee_based':
//                 return (
//                     <>
//                         <Controller
//                             name="fee"
//                             control={control}
//                             rules={{ required: "Fee is required", min: { value: 0, message: "Must be at least 0" } }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.fee} required>
//                                     <Field.Label>Fee (in smallest unit)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         min={0}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />

//                                     </NumberInput.Root>
//                                     <Text>{errors.fee?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="recipient"
//                             control={control}
//                             rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address format" } }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.recipient} required>
//                                     <Field.Label>Recipient Address</Field.Label>
//                                     <Input
//                                         rounded={"full"}
//                                         variant={"subtle"}
//                                         disabled={isPending}
//                                         placeholder="0x..."
//                                         {...field}
//                                     />
//                                     <Text>{errors.recipient?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="coinType"
//                             control={control}
//                             rules={{ required: "Coin Type is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.coinType} required>
//                                     <Field.Label>Coin Type</Field.Label>
//                                     <Input
//                                         disabled={isPending}
//                                         placeholder="e.g., 0x2::sui::SUI"
//                                         {...field}
//                                     />
//                                     <Text>{errors.coinType?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />
//                     </>
//                 );

//             case 'compound':
//                 return (
//                     <>
//                         <Controller
//                             name="timeFrom"
//                             control={control}
//                             rules={{ required: "Time From is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.timeFrom} required>
//                                     <Field.Label>Time From (Unix Timestamp)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />

//                                     </NumberInput.Root>
//                                     <Text>{errors.timeFrom?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="timeTo"
//                             control={control}
//                             rules={{ required: "Time To is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.timeTo} required>
//                                     <Field.Label>Time To (Unix Timestamp)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />

//                                     </NumberInput.Root>
//                                     <Text>{errors.timeTo?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="maxReads"
//                             control={control}
//                             rules={{ required: "Max Reads is required", min: { value: 1, message: "Must be at least 1" } }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.maxReads} required>
//                                     <Field.Label>Max Reads</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         min={1}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />

//                                     </NumberInput.Root>
//                                     <Text>{errors.maxReads?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="fee"
//                             control={control}
//                             rules={{ required: "Fee is required", min: { value: 0, message: "Must be at least 0" } }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.fee} required>
//                                     <Field.Label>Fee (in smallest unit)</Field.Label>
//                                     <NumberInput.Root
//                                         disabled={isPending}
//                                         min={0}
//                                         value={field.value.toString()}
//                                         onChange={(value) => field.onChange(value)}
//                                     >
//                                         <NumberInput.Control />
//                                         <NumberInput.Input onBlur={field.onBlur} />

//                                     </NumberInput.Root>
//                                     <Text>{errors.fee?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="recipient"
//                             control={control}
//                             rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address format" } }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.recipient} required>
//                                     <Field.Label>Recipient Address</Field.Label>
//                                     <Input
//                                         disabled={isPending}
//                                         placeholder="0x..."
//                                         {...field}
//                                     />
//                                     <Text>{errors.recipient?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         <Controller
//                             name="coinType"
//                             control={control}
//                             rules={{ required: "Coin Type is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.coinType} required>
//                                     <Field.Label>Coin Type</Field.Label>
//                                     <Input
//                                         disabled={isPending}
//                                         placeholder="e.g., 0x2::sui::SUI"
//                                         {...field}
//                                     />
//                                     <Text>{errors.coinType?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />
//                     </>
//                 );

//             case 'no_policy':
//                 return <Text>Minting a message with no specific policy.</Text>;

//             default:
//                 return null;
//         }
//     };

//     const policies = createListCollection({
//         items: [
//             { label: "Time Lock", value: "time_lock" as SuperMessageType },
//             { label: "Limited Read", value: "limited_read" as SuperMessageType },
//             { label: "Fee Based", value: "fee_based" as SuperMessageType },
//             { label: "Compound", value: "compound" as SuperMessageType },
//             { label: "No Policy", value: "no_policy" as SuperMessageType }
//         ]
//     })

//     return (
//         <DialogRoot lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} placement={"center"}>
//             <DialogTrigger asChild>
//                 <Button colorPalette={"primary"} loading={open} loadingText={"Minting"}  {...props}>
//                     Super Message
//                 </Button>
//             </DialogTrigger>
//             <DialogBackdrop backdropBlur={"4xl"} />
//             <DialogContent ref={contentRef}>
//                 <DialogHeader>
//                     <Icon rounded={"full"} color={"primary"}>
//                         <FaSuperpowers />
//                     </Icon>
//                     <Text fontSize="xl" fontWeight="bold">Mint Super Message</Text>
//                 </DialogHeader>
//                 <DialogBody>
//                     <Stack gap={4}>
//                         <Field.Root invalid={!!errors.messageType} required>
//                             <Field.Label>Message Type</Field.Label>
//                             <Controller
//                                 name="messageType"
//                                 control={control}
//                                 rules={{ required: "Message type is required" }}
//                                 render={({ field }) => (
//                                     <SelectRoot
//                                         disabled={isPending}
//                                         collection={policies}
//                                         defaultValue={[field.value]}
//                                         onValueChange={({ value }) => field.onChange(value)}
//                                         onInteractOutside={() => field.onBlur()}
//                                     >
//                                         <SelectHiddenSelect />
//                                         <SelectControl>
//                                             <SelectTrigger>
//                                                 <SelectValueText placeholder="Select policy" />
//                                             </SelectTrigger>
//                                         </SelectControl>
//                                         <SelectContent portalRef={contentRef as any}>
//                                             {policies.items.map((policy) => (
//                                                 <SelectItem rounded={"lg"} item={policy} key={policy.value}>
//                                                     {policy.label}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </SelectRoot>
//                                     // <Text>{errors.messageType?.message}</Text>
//                                 )}
//                             />
//                         </Field.Root>

//                         <Controller
//                             name="metadataBlobId"
//                             control={control}
//                             rules={{ required: "Metadata Blob ID is required" }}
//                             render={({ field }) => (
//                                 <Field.Root invalid={!!errors.metadataBlobId} required>
//                                     <Field.Label>Metadata Blob ID</Field.Label>
//                                     <Input
//                                         disabled={isPending}
//                                         placeholder="Enter metadata blob ID"
//                                         {...field}
//                                     />
//                                     <Text>{errors.metadataBlobId?.message}</Text>
//                                 </Field.Root>
//                             )}
//                         />

//                         {renderSpecificInputs()}

//                         {isError && (
//                             <Text color="red.500">
//                                 {error instanceof Error ? error.message : "An unknown error occurred"}
//                             </Text>
//                         )}
//                     </Stack>
//                 </DialogBody>

//                 <DialogFooter>
//                     <Button
//                         colorScheme="blue"
//                         onClick={handleSubmit(onSubmit)}
//                         loading={isPending}
//                         loadingText="Minting"
//                     >
//                         Mint Message
//                     </Button>
//                 </DialogFooter>
//                 <DialogCloseTrigger>
//                     <CloseButton />
//                 </DialogCloseTrigger>
//             </DialogContent>
//         </DialogRoot >
//     );
// }

// function MessageInput({ channelName, onMessageSend, ...props }: MessageInputProps) {

//     const { channel } = useChannel({ channelName });
//     const [message, setMessage] = useState<string>("");
//     const { encryptMessage } = useSealClient();
//     const currentAccount = useCurrentAccount();

//     const handlePublish = async () => {
//         if (!message) return;
//         if (!currentAccount) return;

//         const messageBase = new SuperMessageNoPolicy({
//             groupId: channelName,
//             owner: currentAccount.address,
//             data: {
//                 content: {
//                     text: message,
//                     media: [],
//                 },
//             }
//         })
//         const selfMessageData: TMessageBase = {
//             id: messageBase.getId(),
//             groupId: channelName,
//             owner: currentAccount.address,
//             content: {
//                 text: message,
//             },
//             createdAt: Date.now(),
//         }

//         const encryptedMessage = await encryptMessage(messageBase);

//         const encryptedMessageData: TMessageBase = {
//             id: encryptedMessage.getId(),
//             groupId: channelName,
//             owner: currentAccount.address,
//             content: messageBase.getData().content,
//             createdAt: Date.now(),
//         }

//         channel.publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encryptedMessageData)

//         onMessageSend(selfMessageData, encryptedMessageData);
//     }

//     return (
//         <Textarea
//             bg={"bg.200"}
//             resize={"none"}
//             placeholder="Message"
//             _placeholder={{
//                 color: "fg.contrast"
//             }}
//             rounded={"2xl"}
//             variant={"subtle"}
//             size={"lg"}
//             shadow={"custom.sm"}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={(e) => {
//                 if (e.key === "Enter") {
//                     handlePublish();
//                     setMessage("");
//                 }
//             }}
//             {...props}
//         />
//     )
// }

interface MessageInputProps extends Omit<TextareaProps, 'onChange' | 'value'> {
    value: string;
    onChange: (value: string) => void;
}
function MessageInput({ value, onChange, ...props }: MessageInputProps) {
    return (
        <Textarea
            bg={"bg.200"}
            resize={"none"}
            placeholder="Type your message here..." // Changed placeholder
            _placeholder={{
                color: "fg.contrast"
            }}
            rounded={"2xl"}
            variant={"subtle"}
            size={"lg"}
            shadow={"custom.sm"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    );
}

interface FormValues {
    content: Uint8Array;
    metadataBlobId: string;
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
    const { onMessageMinted } = props;
    const currentAccount = useCurrentAccount();
    const { group } = useGroup(); // Assuming group ID comes from here
    const queryClient = useQueryClient();
    const {
        mint_super_message_time_lock_and_transfer,
        mint_super_message_no_policy_and_transfer,
        mint_super_message_fee_based_and_transfer,
        mint_super_message_limited_read_and_transfer,
        mint_super_message_compound_and_transfer,
    } = useChatiwalClient()
    const { storeMessage } = useWalrusClient();
    const { mutate: mintSuperMessage, isPending, isError, error, reset: resetMutation } = useMutation({
        mutationFn: async (params: MintParams) => {
            console.log("Mutation function called with:", params);
            if (!group?.id) throw new Error("Group ID is not available");

            // *** IMPORTANT: How is metadataBlobId related to messageText? ***
            // This implementation assumes metadataBlobId is provided separately.
            // If messageText needs to be packaged into a blob first,
            // that logic needs to happen in `onSubmit` *before* calling this mutation.
            if (!params.metadataBlobId) {
                // If no explicit metadata is given, maybe we default based on text?
                // This part needs clarification based on your backend/contract logic.
                // For now, we require metadataBlobId if the type isn't 'no_policy' potentially.
                // Or maybe 'no_policy' doesn't need a blob? Let's assume it might still.
                console.warn("metadataBlobId is empty. Ensure this is intended or handle text-to-blob conversion.");
                // Example: If no_policy doesn't need a blob:
                // if (params.type !== 'no_policy' && !params.metadataBlobId) {
                //    throw new Error("Metadata Blob ID is required for this policy type.");
                // }
            }


            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo) throw new Error("Missing time parameters for Time Lock");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Time Lock");
                    return mint_super_message_time_lock_and_transfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
                case 'limited_read':
                    if (!params.maxReads) throw new Error("Missing maxReads for Limited Read");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Limited Read");
                    return mint_super_message_limited_read_and_transfer(group.id, params.metadataBlobId, params.maxReads);
                case 'fee_based':
                    if (params.fee === undefined || !params.recipient || !params.coinType) throw new Error("Missing parameters for Fee Based");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Fee Based");
                    return mint_super_message_fee_based_and_transfer(group.id, params.metadataBlobId, BigInt(params.fee), params.recipient, params.coinType); // Ensure fee is BigInt
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads || params.fee === undefined || !params.recipient || !params.coinType)
                        throw new Error("Missing parameters for Compound");
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for Compound");
                    return mint_super_message_compound_and_transfer(
                        group.id,
                        params.metadataBlobId,
                        params.timeFrom,
                        params.timeTo,
                        params.maxReads,
                        BigInt(params.fee), // Ensure fee is BigInt
                        params.recipient,
                        params.coinType
                    );
                case 'no_policy':
                    if (!params.metadataBlobId) throw new Error("Missing metadataBlobId for No Policy"); // Assuming it's still needed
                    // If 'no_policy' doesn't actually use metadataBlobId, adjust this call:
                    return mint_super_message_no_policy_and_transfer(group.id, params.metadataBlobId /* or potentially remove if not needed */);
                default:
                    throw new Error(`Unknown message type: ${params.type}`);
            }
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
                onMessageMinted({ ...variables, ...data, /* potentially add text content */ });
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
            metadataBlobId: '',
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

    const handleStoreMessage = async (data: FormValues): Promise<String> => {
        if (!group?.id) {
            toaster.error({ title: "Error", description: "Group context is missing." });
            return "";
        }

        let message;

        switch (messageType) {
            case 'no_policy':
                message = new SuperMessageNoPolicy({
                    data: {
                        content: data.content,
                    },
                    groupId: group.id,
                    owner: currentAccount?.address,
                })
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
        }

        // --- Submit Handler ---
        const onSubmit = (data: FormValues) => {
            // ** Crucial Step: Handle messageText -> metadataBlobId **
            // If you need to create a metadata blob from data.messageText here,
            // do it now and get the resulting ID. Replace data.metadataBlobId if necessary.
            // Example (pseudo-code):
            // let finalMetadataBlobId = data.metadataBlobId;
            // if (!finalMetadataBlobId && data.messageText) {
            //    try {
            //       finalMetadataBlobId = await createMetadataBlob(data.messageText); // Your function
            //    } catch (blobError) {
            //       toaster.error({ title: "Metadata Error", description: "Failed to prepare message metadata." });
            //       return;
            //    }
            // } else if (!finalMetadataBlobId && data.messageType !== 'no_policy') {
            //     // Require blob ID if not automatically created and policy needs it
            //     toaster.error({ title: "Input Error", description: "Metadata Blob ID is required for this policy." });
            //     return;
            // }

            // For now, we proceed assuming data.metadataBlobId is correct or handled implicitly

            if (!group?.id) {
                toaster.error({ title: "Error", description: "Group context is missing." });
                return;
            }

            try {
                const params: Partial<MintParams> & { type: SuperMessageType, groupId: string, metadataBlobId: string } = {
                    type: data.messageType,
                    groupId: group.id, // Use group id from hook
                    metadataBlobId: data.metadataBlobId, // Use blob ID from form
                    // messageContent: data.messageText // Maybe pass text separately if needed by mutation?
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
                    name="messageText"
                    control={control}
                    // Add rules if message text is required even for super messages
                    // rules={{ required: "Message cannot be empty" }}
                    render={({ field }) => (
                        <MessageInput
                            value={field.value}
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
                                    onValueChange={({ value }) => field.onChange(value[0])} // Update form state
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

                    {/* Metadata Blob ID Input - Conditionally show or always require? */}
                    {/* Show if *any* policy is selected, or always? Depends on logic */}
                    {/* Let's show it always for now, user might provide it even for no_policy */}
                    <Controller
                        name="metadataBlobId"
                        control={control}
                        // Make required only if messageType is not 'no_policy', or always required?
                        // Adjust rules based on your backend requirements.
                        rules={{ required: messageType !== 'no_policy' ? "Metadata Blob ID is required for this policy" : false }}
                        render={({ field }) => (
                            <Field.Root invalid={!!errors.metadataBlobId} required={messageType !== 'no_policy'} flex={2}>
                                <Field.Label fontSize="sm">Metadata Blob ID</Field.Label>
                                <Input
                                    size="sm"
                                    variant={"outline"}
                                    disabled={isPending}
                                    placeholder="Enter ID (e.g., from uploaded file)"
                                    {...field}
                                />
                                {errors.metadataBlobId && <Text fontSize="xs" color="red.500">{errors.metadataBlobId.message}</Text>}
                            </Field.Root>
                        )}
                    />
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
                        colorScheme="primary" // Use your theme's primary color
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