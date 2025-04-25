import { ChatiwalMascotIcon } from "@/components/global/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot } from "@/components/ui/dialog";
import { DialogBackdrop, DialogTrigger, Field, Icon, Input, Text, useDisclosure } from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, Controller, useForm } from "react-hook-form";
import { useGroup } from "../_hooks/useGroupId";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { toaster } from "@/components/ui/toaster";

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
    const { onOpen, open, setOpen } = useDisclosure()
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
    const { add_member, validate_group_cap } = useChatiwalClient();
    const suiClient = useSuiClient();

    const { data: group_cap, isSuccess } = useQuery({
        queryKey: ["group::members::group_cap"],
        queryFn: async () => {
            if (!group) throw new Error("Group not found");
            const group_cap = await validate_group_cap(group.id);
            return group_cap;
        },

    })

    const { mutate: addMember, isPending, isError, error, reset } = useMutation({
        mutationFn: async (params: AddMemberParams) => {
            const { groupId, member } = params;
            const tx = await add_member(groupId, member, group_cap);

            const res = await signAndExecuteTransaction({
                transaction: tx,
            });

            const { errors } = await suiClient.waitForTransaction(res);

            if (errors) {
                throw new Error("Transaction failed");
            }

            return true;
        },
        onError: (error) => {
            toaster.error({
                title: "Error",
                description: error.message,
            });
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
            addMember({
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
            <DialogTrigger asChild>
                <Button colorPalette={"default"} loading={open} loadingText={"Adding"}  {...props}>
                    Add member
                </Button>
            </DialogTrigger>
            <DialogBackdrop backdropBlur={"4xl"} />
            <DialogContent>
                <DialogHeader>
                    <Icon rounded={"full"} color={"primary"}>
                        <ChatiwalMascotIcon />
                    </Icon>
                    <Text fontSize="xl" fontWeight="bold">Add Member</Text>
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
                                    disabled={isPending}
                                    placeholder="0x..."
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
                <DialogCloseTrigger>
                    <CloseButton />
                </DialogCloseTrigger>
            </DialogContent>
        </DialogRoot >
    )
}