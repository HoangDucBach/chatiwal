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
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useEffect, useRef } from "react";
import { useGroup } from "../_hooks/useGroupId";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "@/components/ui/select";

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
export function MintSuperMessage(props: Props) {
    const { group } = useGroup();
    const queryClient = useQueryClient();
    const { open, onClose, setOpen } = useDisclosure();
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        mint_super_message_time_lock_and_transfer,
        mint_super_message_no_policy_and_transfer,
        mint_super_message_fee_based_and_transfer,
        mint_super_message_limited_read_and_transfer,
        mint_super_message_compound_and_transfer,
    } = useChatiwalClient();

    const {
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset: resetForm
    } = useForm<FormValues>({
        defaultValues: {
            messageType: 'time_lock',
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

    const { mutate: mintSuperMessage, isPending, isError, error, reset } = useMutation({
        mutationFn: async (params: MintParams) => {
            console.log("Mutation function called with:", params);

            switch (params.type) {
                case 'time_lock':
                    if (!params.timeFrom || !params.timeTo) throw new Error("Missing time parameters for Time Lock");
                    return mint_super_message_time_lock_and_transfer(group.id, params.metadataBlobId, params.timeFrom, params.timeTo);
                case 'limited_read':
                    if (!params.maxReads) throw new Error("Missing maxReads for Limited Read");
                    return mint_super_message_limited_read_and_transfer(group.id, params.metadataBlobId, params.maxReads);
                case 'fee_based':
                    if (!params.fee || !params.recipient || !params.coinType) throw new Error("Missing parameters for Fee Based");
                    return mint_super_message_fee_based_and_transfer(group.id, params.metadataBlobId, params.fee, params.recipient, params.coinType);
                case 'compound':
                    if (!params.timeFrom || !params.timeTo || !params.maxReads || !params.fee || !params.recipient || !params.coinType)
                        throw new Error("Missing parameters for Compound");
                    return mint_super_message_compound_and_transfer(
                        group.id,
                        params.metadataBlobId,
                        params.timeFrom,
                        params.timeTo,
                        params.maxReads,
                        params.fee,
                        params.recipient,
                        params.coinType
                    );
                case 'no_policy':
                    return mint_super_message_no_policy_and_transfer(group.id, params.metadataBlobId);
                default:
                    throw new Error(`Unknown message type: ${params.type}`);
            }
        },
        onSuccess: (data, variables) => {
            console.log('Mutation successful:', data);
            queryClient.invalidateQueries({ queryKey: ['superMessages', variables.groupId] });

            toaster.success({
                title: "Success",
                description: "Super message minted successfully",
                duration: 5000,
            });

            onClose();
        },
        onError: (error) => {
            console.error('Mutation failed:', error);
            toaster.error({
                title: "Error",
                description: error.message || "Failed to mint super message",
                duration: 5000,
            });
        },
    });

    useEffect(() => {
        if (!open) {
            reset();
            resetForm();
        }
    }, [open, reset, resetForm]);

    const onSubmit = (data: FormValues) => {
        try {
            const params: Partial<MintParams> = {
                type: data.messageType,
                groupId: data.groupId,
                metadataBlobId: data.metadataBlobId,
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

    const renderSpecificInputs = () => {
        switch (messageType) {
            case 'time_lock':
                return (
                    <>
                        <Controller
                            name="timeFrom"
                            control={control}
                            rules={{ required: "Time From is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeFrom} required>
                                    <Field.Label>Time From (Unix Timestamp)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    <Text>{errors.timeFrom?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="timeTo"
                            control={control}
                            rules={{ required: "Time To is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeTo} required>
                                    <Field.Label>Time To (Unix Timestamp)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />
                                    </NumberInput.Root>
                                    <Text>{errors.timeTo?.message}</Text>
                                </Field.Root>
                            )}
                        />
                    </>
                );

            case 'limited_read':
                return (
                    <Controller
                        name="maxReads"
                        control={control}
                        rules={{ required: "Max Reads is required", min: { value: 1, message: "Must be at least 1" } }}
                        render={({ field }) => (
                            <Field.Root invalid={!!errors.maxReads} required>
                                <Field.Label>Max Reads</Field.Label>
                                <NumberInput.Root
                                    disabled={isPending}
                                    min={1}
                                    value={field.value.toString()}
                                    onChange={(value) => field.onChange(value)}
                                >
                                    <NumberInput.Control />
                                    <NumberInput.Input onBlur={field.onBlur} />
                                </NumberInput.Root>
                                <Text>{errors.maxReads?.message}</Text>
                            </Field.Root>
                        )}
                    />
                );

            case 'fee_based':
                return (
                    <>
                        <Controller
                            name="fee"
                            control={control}
                            rules={{ required: "Fee is required", min: { value: 0, message: "Must be at least 0" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.fee} required>
                                    <Field.Label>Fee (in smallest unit)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        min={0}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />

                                    </NumberInput.Root>
                                    <Text>{errors.fee?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="recipient"
                            control={control}
                            rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address format" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.recipient} required>
                                    <Field.Label>Recipient Address</Field.Label>
                                    <Input
                                        rounded={"full"}
                                        variant={"subtle"}
                                        disabled={isPending}
                                        placeholder="0x..."
                                        {...field}
                                    />
                                    <Text>{errors.recipient?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="coinType"
                            control={control}
                            rules={{ required: "Coin Type is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.coinType} required>
                                    <Field.Label>Coin Type</Field.Label>
                                    <Input
                                        disabled={isPending}
                                        placeholder="e.g., 0x2::sui::SUI"
                                        {...field}
                                    />
                                    <Text>{errors.coinType?.message}</Text>
                                </Field.Root>
                            )}
                        />
                    </>
                );

            case 'compound':
                return (
                    <>
                        <Controller
                            name="timeFrom"
                            control={control}
                            rules={{ required: "Time From is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeFrom} required>
                                    <Field.Label>Time From (Unix Timestamp)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />

                                    </NumberInput.Root>
                                    <Text>{errors.timeFrom?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="timeTo"
                            control={control}
                            rules={{ required: "Time To is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.timeTo} required>
                                    <Field.Label>Time To (Unix Timestamp)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />

                                    </NumberInput.Root>
                                    <Text>{errors.timeTo?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="maxReads"
                            control={control}
                            rules={{ required: "Max Reads is required", min: { value: 1, message: "Must be at least 1" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.maxReads} required>
                                    <Field.Label>Max Reads</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        min={1}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />

                                    </NumberInput.Root>
                                    <Text>{errors.maxReads?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="fee"
                            control={control}
                            rules={{ required: "Fee is required", min: { value: 0, message: "Must be at least 0" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.fee} required>
                                    <Field.Label>Fee (in smallest unit)</Field.Label>
                                    <NumberInput.Root
                                        disabled={isPending}
                                        min={0}
                                        value={field.value.toString()}
                                        onChange={(value) => field.onChange(value)}
                                    >
                                        <NumberInput.Control />
                                        <NumberInput.Input onBlur={field.onBlur} />

                                    </NumberInput.Root>
                                    <Text>{errors.fee?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="recipient"
                            control={control}
                            rules={{ required: "Recipient is required", pattern: { value: /^0x[a-fA-F0-9]+$/, message: "Invalid address format" } }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.recipient} required>
                                    <Field.Label>Recipient Address</Field.Label>
                                    <Input
                                        disabled={isPending}
                                        placeholder="0x..."
                                        {...field}
                                    />
                                    <Text>{errors.recipient?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        <Controller
                            name="coinType"
                            control={control}
                            rules={{ required: "Coin Type is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.coinType} required>
                                    <Field.Label>Coin Type</Field.Label>
                                    <Input
                                        disabled={isPending}
                                        placeholder="e.g., 0x2::sui::SUI"
                                        {...field}
                                    />
                                    <Text>{errors.coinType?.message}</Text>
                                </Field.Root>
                            )}
                        />
                    </>
                );

            case 'no_policy':
                return <Text>Minting a message with no specific policy.</Text>;

            default:
                return null;
        }
    };

    const policies = createListCollection({
        items: [
            { label: "Time Lock", value: "time_lock" as SuperMessageType },
            { label: "Limited Read", value: "limited_read" as SuperMessageType },
            { label: "Fee Based", value: "fee_based" as SuperMessageType },
            { label: "Compound", value: "compound" as SuperMessageType },
            { label: "No Policy", value: "no_policy" as SuperMessageType }
        ]
    })

    return (
        <DialogRoot lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} placement={"center"}>
            <DialogTrigger asChild>
                <Button colorPalette={"primary"} loading={open} loadingText={"Minting"}  {...props}>
                    Super Message
                </Button>
            </DialogTrigger>
            <DialogBackdrop backdropBlur={"4xl"}/>
            <DialogContent ref={contentRef}>
                <DialogHeader>
                    <Icon rounded={"full"} color={"primary"}>
                        <FaSuperpowers />
                    </Icon>
                    <Text fontSize="xl" fontWeight="bold">Mint Super Message</Text>
                </DialogHeader>
                <DialogBody>
                    <Stack gap={4}>
                        <Field.Root invalid={!!errors.messageType} required>
                            <Field.Label>Message Type</Field.Label>
                            <Controller
                                name="messageType"
                                control={control}
                                rules={{ required: "Message type is required" }}
                                render={({ field }) => (
                                    <SelectRoot
                                        disabled={isPending}
                                        collection={policies}
                                        defaultValue={[field.value]}
                                        onValueChange={({ value }) => field.onChange(value)}
                                        onInteractOutside={() => field.onBlur()}
                                    >
                                        <SelectHiddenSelect />
                                        <SelectControl>
                                            <SelectTrigger>
                                                <SelectValueText placeholder="Select policy" />
                                            </SelectTrigger>
                                        </SelectControl>
                                        <SelectContent portalRef={contentRef as any}>
                                            {policies.items.map((policy) => (
                                                <SelectItem rounded={"lg"} item={policy} key={policy.value}>
                                                    {policy.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                    // <Text>{errors.messageType?.message}</Text>
                                )}
                            />
                        </Field.Root>

                        <Controller
                            name="metadataBlobId"
                            control={control}
                            rules={{ required: "Metadata Blob ID is required" }}
                            render={({ field }) => (
                                <Field.Root invalid={!!errors.metadataBlobId} required>
                                    <Field.Label>Metadata Blob ID</Field.Label>
                                    <Input
                                        disabled={isPending}
                                        placeholder="Enter metadata blob ID"
                                        {...field}
                                    />
                                    <Text>{errors.metadataBlobId?.message}</Text>
                                </Field.Root>
                            )}
                        />

                        {renderSpecificInputs()}

                        {isError && (
                            <Text color="red.500">
                                {error instanceof Error ? error.message : "An unknown error occurred"}
                            </Text>
                        )}
                    </Stack>
                </DialogBody>

                <DialogFooter>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit(onSubmit)}
                        loading={isPending}
                        loadingText="Minting"
                    >
                        Mint Message
                    </Button>
                </DialogFooter>
                <DialogCloseTrigger>
                    <CloseButton />
                </DialogCloseTrigger>
            </DialogContent>
        </DialogRoot >
    );
}