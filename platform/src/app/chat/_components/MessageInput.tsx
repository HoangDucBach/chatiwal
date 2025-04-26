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
    FileUpload
} from "@chakra-ui/react";
import { HiUpload, HiDocumentText, HiPhotograph, HiFilm } from "react-icons/hi";
import { nanoid } from "nanoid";

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

interface MessageInputProps {
    value: string;
    mediaContent?: MediaContent | null;
    onChange: (value: string, mediaContent?: MediaContent | null) => void;
    [key: string]: any;
}

function MessageInput({ value, mediaContent, onChange, ...props }: MessageInputProps) {
    const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value, mediaContent);
    };

    const handleFileChange = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) {
            // If no files are selected, maintain the current text value but clear media
            onChange(value, null);
            return;
        }

        const file = files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target && event.target.result) {
                const arrayBuffer = event.target.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);

                // Create a new MediaContent object with the file data
                const newMediaContent: MediaContent = {
                    id: nanoid(), // Generate a unique ID
                    raw: uint8Array,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type
                };

                // If it's an image, try to get dimensions
                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = () => {
                        newMediaContent.dimensions = {
                            width: img.width,
                            height: img.height
                        };
                        // Update the state with dimensions
                        onChange(value, newMediaContent);
                    };

                    // Create a URL for the image to load dimensions
                    const objectUrl = URL.createObjectURL(file);
                    img.src = objectUrl;

                    // Cleanup the URL after loading
                    return () => URL.revokeObjectURL(objectUrl);
                } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                    // For video/audio, we could get duration, but that requires more complex handling
                    // This would typically be done with the media element's loadedmetadata event
                    // For simplicity, we're skipping that here
                }

                // Call onChange with both the current text value and the new media content
                onChange(value, newMediaContent);
            }
        };

        reader.readAsArrayBuffer(file);
    }, [value, onChange]);

    const removeFile = useCallback(() => {
        onChange(value, null);
    }, [value, onChange]);

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return HiPhotograph;
        if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return HiFilm;
        return HiDocumentText;
    };

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
        <Box w="100%">
            <Flex direction="column" gap={2}>
                {mediaContent && (
                    <HStack
                        bg="bg.300"
                        p={2}
                        rounded="lg"
                        justify="space-between"
                    >
                        <HStack>
                            <Icon as={getFileIcon(mediaContent.mimeType)} boxSize={5} color="accent.500" />
                            <Text fontSize="sm" fontWeight="medium">
                                {mediaContent.name}
                            </Text>
                            {mediaContent.size && (
                                <Text fontSize="xs" color="fg.muted">
                                    ({(mediaContent.size / 1024).toFixed(1)} KB)
                                </Text>
                            )}
                        </HStack>
                        <CloseButton size="sm" onClick={removeFile} />
                    </HStack>
                )}

                <Textarea
                    bg="bg.200"
                    resize="none"
                    placeholder="Type your message here..."
                    _placeholder={{
                        color: "fg.contrast"
                    }}
                    rounded="2xl"
                    variant="subtle"
                    size="lg"
                    shadow="custom.sm"
                    value={value}
                    onChange={handleTextChange}
                    {...props}
                />

                <Flex justify="flex-end">
                    <FileUpload.Root accept={acceptedFileTypes} onFileAccept={(acceptFiles) => handleFileChange(acceptFiles.files)}>
                        <FileUpload.HiddenInput />
                        <FileUpload.Trigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                colorScheme="teal"
                            >
                                <Icon>
                                    <HiUpload />
                                </Icon>
                                Upload file
                            </Button>
                        </FileUpload.Trigger>
                    </FileUpload.Root>
                </Flex>
            </Flex>
        </Box>
    );
}

export default MessageInput;