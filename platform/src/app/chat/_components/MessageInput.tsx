import { useState, useCallback, forwardRef } from "react";
import {
    Textarea,
    Text,
    HStack,
    Icon,
    CloseButton,
    FileUpload,
    For,
    VStack,
    TextareaProps,
    FileUploadRootProps,
} from "@chakra-ui/react";
import { HiDocumentText, HiPhotograph, HiFilm } from "react-icons/hi";
import { ImAttachment } from "react-icons/im";
import { Tooltip } from "@/components/ui/tooltip";

const MAX_FILE_SIZE = 60 * 1024; // 60 KB
function FileCard({ file, removeFile }: { file: File, removeFile: () => void }) {
    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return HiPhotograph;
        if (type.startsWith('video/') || type.startsWith('audio/')) return HiFilm;
        return HiDocumentText;
    };

    return (
        <HStack
            key={file.name}
            bg="bg.400"
            px={"2"}
            py={"1"}
            rounded="2xl"
            justify="space-between"
            align={"start"}
            cursor={"pointer"}
        >
            <Tooltip content={file.name} openDelay={100} closeDelay={100}>
                <HStack align={"start"}>
                    <Icon as={getFileIcon(file.type)} boxSize={5} color="accent.500" />
                    <VStack gap={0} align={"start"}>
                        <Text fontSize="xs" fontWeight="medium" maxW={"16"} truncate>
                            {file.name}
                        </Text>
                        {file.size && (
                            <Text fontSize="2xs" color="fg.contrast">
                                {(file.size / 1024).toFixed(1)} KB
                            </Text>
                        )}
                    </VStack>
                </HStack>
            </Tooltip>
            <CloseButton size="sm" onClick={removeFile} />
        </HStack>
    )
}
interface TextInputProps extends TextareaProps {
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>((props, ref) => {
    return (
        <Textarea
            ref={ref}
            resize="none"
            focusRing="none"
            border="none"
            bg="transparent"
            _placeholder={{
                color: "fg.contrast"
            }}
            variant="subtle"
            size="sm"
            {...props}
        />
    );
})


interface MediaInputProps extends FileUploadRootProps {
}

export const MediaInput = forwardRef<HTMLInputElement, MediaInputProps>(({ ...props }, ref) => {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (file: File) => {
        console.log(file);
        if (file.size > MAX_FILE_SIZE) {
            setError("File size exceeds 60 KB");
            return;
        }
        setFiles((prev) => [...prev, file]);
    }


    const removeFile = useCallback((idToRemove: string) => {
        setFiles((prev) => prev.filter((file) => file.name !== idToRemove));
    }, []);

    const acceptedFileTypes = [
        'image/*', 'video/*', 'audio/*', 'text/*', 'application/pdf'
    ];

    return (
        <HStack w="full">
            {files.length === 0 && (
                <FileUpload.Root
                    w={"fit"}
                    accept={acceptedFileTypes}
                    onFileChange={(d => handleFileChange(d.acceptedFiles[0]))}
                    onFileReject={(d) => {
                        d.files.forEach((rejFile) => {
                            if (rejFile.file.size > MAX_FILE_SIZE) {
                                setError("File size exceeds 60 KB");
                            }
                            else {
                                setError("File type not supported");
                            }
                        })
                    }}
                    maxFileSize={MAX_FILE_SIZE}
                    maxFiles={1}
                    {...props}
                >
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger p={"2"}>
                        <Icon as={ImAttachment} />
                    </FileUpload.Trigger>
                </FileUpload.Root>
            )
            }
            {error && (
                <Text fontSize="xs" w={"fit"} color="red.500">
                    {error}
                </Text>
            )}
            <HStack gap={"2"} w={"full"}>
                <For each={files} fallback={null}>
                    {(file) => (
                        <FileCard
                            key={file.name}
                            file={file}
                            removeFile={() => removeFile(file.name)}
                        />
                    )}
                </For>
            </HStack>
        </HStack >
    );
})
