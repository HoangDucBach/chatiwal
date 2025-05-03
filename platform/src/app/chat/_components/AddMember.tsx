import { ChatiwalMascotIcon } from "@/components/global/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter, DialogHeader, DialogRoot } from "@/components/ui/dialog";
import { DialogBackdrop, DialogTrigger, Field, Heading, Icon, Input, Text, useDisclosure, VStack } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useGroup } from "../_hooks/useGroupId";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { toaster } from "@/components/ui/toaster";
import { useSupabase } from "@/hooks/useSupabase";

type FormValues = {
    member: string;
}
type AddMemberParams = {
    groupId: string;
    member: string;
}
interface AddMemberProps extends ButtonProps {
}
export default function AddMember(
    props: AddMemberProps
) {
    const { group } = useGroup();
    const { onClose, open, setOpen } = useDisclosure()
    const {
        handleSubmit,
        control,
        watch,
        formState: { errors },
        reset: resetForm
    } = useForm<FormValues>({
        defaultValues: {
            member: "",
        },
    });
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { addMember, validateGroupCap } = useChatiwalClient();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { addGroupMembership } = useSupabase();

    const { data: group_cap, isSuccess } = useQuery({
        queryKey: ["group::members::group_cap"],
        queryFn: async () => {
            if (!group) throw new Error("Group not found");
            const group_cap = await validateGroupCap(group.id);
            return group_cap;
        },

    })

    const { mutate: add, isPending, isError, error, reset } = useMutation({
        mutationFn: async (params: AddMemberParams) => {
            const { groupId, member } = params;
            const tx = await addMember(groupId, member, group_cap);

            const res = await signAndExecuteTransaction({
                transaction: tx,
            });

            const { errors } = await suiClient.waitForTransaction(res);

            if (errors) {
                throw new Error("Transaction failed");
            }

            await addGroupMembership(member, groupId);

            return true;
        },
        onError: (error) => {
            toaster.error({
                title: "Error",
                description: error.message,
            });
            queryClient.invalidateQueries({
                queryKey: ["group", group.id],
            })
            onClose();
        },

        onSuccess: () => {
            toaster.success({
                title: "Success",
                description: "Member added successfully",
            });
            resetForm();
            setOpen(false);
        }
    });

    const onSubmit = async (data: FormValues) => {
        const { member } = data;
        try {
            add({
                groupId: group.id,
                member
            });
        } catch (error) {
            console.error(error);
        }
    }
    if (!group) return null;
    if (!group_cap) return null;

    return (
        <DialogRoot lazyMount open={open} onOpenChange={(e) => setOpen(e.open)} placement={"center"}>
            <DialogTrigger asChild {...props}>
                <Button colorPalette={"primary"} loading={open} loadingText={"Adding"}  {...props}>
                    Add member
                </Button>
            </DialogTrigger>
            <DialogBackdrop backdropBlur={"4xl"} />
            <DialogContent>
                <DialogHeader flexDirection={"row"} justifyContent={"space-between"} alignItems={"start"} rounded={"3xl"} shadow={"custom.sm"} bg={"bg.50"}>
                    <VStack align={"start"}>
                        <Heading as={"h6"} size={"lg"}>Add member</Heading>
                        <Text fontSize={"sm"} color={"fg.700"}>
                            Add a member to the group
                        </Text>
                    </VStack>
                </DialogHeader>
                <DialogBody>
                    <Controller
                        name="member"
                        control={control}
                        rules={{ required: "Member is required" }}
                        render={({ field }) => (
                            <Field.Root invalid={!!errors.member} required>
                                <Field.Label>Member</Field.Label>
                                <Input
                                    bg={"bg.300"}
                                    color={"fg"}
                                    variant={"subtle"}
                                    rounded={"lg"}
                                    disabled={isPending}
                                    placeholder="0x..."
                                    _placeholder={{
                                        color: "fg.contrast"
                                    }}
                                    {...field}
                                />
                                <Text>{errors.member?.message}</Text>
                            </Field.Root>
                        )}
                    />
                </DialogBody>

                <DialogFooter>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit(onSubmit)}
                        loading={isPending}
                        loadingText="Adding"
                        disabled={isPending || !!errors.member}
                    >
                        Add Member
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogRoot >
    )
}