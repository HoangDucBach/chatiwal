import { useState, useCallback, ChangeEvent } from "react";
import {
    Textarea,
    Button,
    Flex,
    Text,
    Box,
    HStack,
    Icon,
    CloseButton,
    FileUpload,
    For,
    VStack,
} from "@chakra-ui/react";
import { HiDocumentText, HiPhotograph, HiFilm } from "react-icons/hi";
import { ImAttachment } from "react-icons/im";
import { nanoid } from "nanoid";
import { Tooltip } from "@/components/ui/tooltip";
export type MediaContent = {
    id: string;
    url?: string;
    raw?: Uint8Array;
    name?: string;
    size?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    mimeType: string;
};

function FileCard({ mediaContent, removeFile }: { mediaContent: MediaContent, removeFile: () => void }) {
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return HiPhotograph;
        if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return HiFilm;
        return HiDocumentText;
    };

    return (
        <HStack
            key={mediaContent.id}
            bg="bg.400"
            px={"2"}
            py={"1"}
            rounded="2xl"
            justify="space-between"
            align={"start"}
            cursor={"pointer"}
        >
            <Tooltip content={mediaContent.name} openDelay={100} closeDelay={100}>
                <HStack align={"start"}>
                    <Icon as={getFileIcon(mediaContent.mimeType)} boxSize={5} color="accent.500" />
                    <VStack gap={0} align={"start"}>
                        <Text fontSize="xs" fontWeight="medium" maxW={"16"} truncate>
                            {mediaContent.name}
                        </Text>
                        {mediaContent.size && (
                            <Text fontSize="2xs" color="fg.contrast">
                                {(mediaContent.size / 1024).toFixed(1)} KB
                            </Text>
                        )}
                    </VStack>
                </HStack>
            </Tooltip>
            <CloseButton size="sm" onClick={removeFile} />
        </HStack>
    )
}
interface MessageInputProps {
    value: string;
    onChange: (value: string, mediaContent?: MediaContent | null) => void;
    tools?: React.ReactNode;
    [key: string]: any;
}

function MessageInput({ value, onChange, ...props }: MessageInputProps) {
    const [mediaContents, setMediaContents] = useState<MediaContent[]>([]);
    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value, mediaContents[0]);
    };

    const handleFileChange = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) {
            onChange(value, null);
            return;
        }

        const file = files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target && event.target.result) {
                const arrayBuffer = event.target.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);

                const newMediaContent: MediaContent = {
                    id: nanoid(), // Generate a unique ID
                    raw: uint8Array,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type
                };

                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = () => {
                        newMediaContent.dimensions = {
                            width: img.width,
                            height: img.height
                        };
                        onChange(value, newMediaContent);
                        URL.revokeObjectURL(objectUrl);
                    };

                    const objectUrl = URL.createObjectURL(file);
                    img.src = objectUrl;

                    // Cleanup the URL after loading
                } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                    // For video/audio, we could get duration, but that requires more complex handling
                    // This would typically be done with the media element's loadedmetadata event
                    // For simplicity, we're skipping that here
                }
                setMediaContents((prev) => [...prev, newMediaContent]);

                // Call onChange with both the current text value and the new media content
                onChange(value, newMediaContent);
            }
        };

        reader.readAsArrayBuffer(file);
    }, [value, onChange]);

    const removeFile = useCallback(() => {
        onChange(value, null);
        setMediaContents((prev) => prev.filter((mediaContent) => mediaContent.id !== mediaContents[0].id));
    }, [value, onChange]);

    const acceptedFileTypes = [
        'image/*',     // All image types
        'video/*',     // All video types
        'audio/*',     // All audio types
        'text/*',      // All text types
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Add more specific MIME types as needed
    ];

    return (
        <VStack gap={0} bg={"bg.300"}
            _focusWithin={{
                outline: "1px solid",
                outlineColor: "fg",
                outlineOffset: "2px",
            }}
            p={2}
            rounded="3xl"
        >
            <Textarea
                resize="none"
                focusRing={"none"}
                border={"none"}
                bg="transparent"
                placeholder="Type your message here..."
                _placeholder={{
                    color: "fg.contrast"
                }}
                variant="subtle"
                size="sm"
                // value={value}
                onChange={handleTextChange}
                {...props}
            />

            <HStack w="full">
                <FileUpload.Root w={"fit"} accept={acceptedFileTypes} onFileAccept={(acceptFiles) => handleFileChange(acceptFiles.files)}>
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger asChild>
                        <Button
                            variant="plain"
                            size="sm"
                            color={"fg.contrast"}
                            _hover={{
                                color: "fg"
                            }}
                        >
                            <Icon>
                                <ImAttachment />
                            </Icon>
                        </Button>
                    </FileUpload.Trigger>
                </FileUpload.Root>
                <HStack gap={"2"} w={"full"}>
                    <For each={mediaContents} fallback={null}>
                        {(mediaContent) => (
                            <FileCard
                                key={mediaContent.id}
                                mediaContent={mediaContent}
                                removeFile={() => {
                                    setMediaContents((prev) => prev.filter((item) => item.id !== mediaContent.id));
                                    onChange(value, null);
                                }}
                            />
                        )}
                    </For>
                </HStack>
                {props.tools}
            </HStack>
        </VStack>
    );
}

export default MessageInput;