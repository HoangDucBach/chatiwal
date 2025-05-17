import { encode } from "@msgpack/msgpack";
import { SUI_ADDRESS_LENGTH } from "@mysten/sui/utils";
import { nanoid } from "nanoid";

export function formatBalance(balance: bigint, decimals = 9): string {
    const divisor = 10n ** BigInt(decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;

    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 2);
    return `${whole}.${fractionStr}`;
}

type ColorOptions = {
    alpha?: number;
}
export function generateColorFromAddress(addr: string, options?: ColorOptions): string {
    const clean = addr.startsWith('0x') ? addr.slice(2) : addr;
    const hash = parseInt(clean.slice(0, 6), 16);
    const hue = hash % 360;
    const saturation = 60 + (hash % 20); // 60–80%
    const lightness = 50 + (hash % 20); // 50–70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)/${options?.alpha || 100}`;
}

export function generateColorFromString(str: string, options?: ColorOptions): string {
    const hash = Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    const saturation = 60 + (hash % 20); // 60–80%
    const lightness = 50 + (hash % 20); // 50–70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)/${options?.alpha || 100}`;
}

export const TypeSuffixRegex = /<([^>]+)>/;

export function generateContentId(prefix: Uint8Array): Uint8Array {
    const contentNonceId = nanoid();
    const contentHashBytes = encode(contentNonceId);
    return new Uint8Array([...prefix, ...contentHashBytes]);
}

export function extractPrefixFromContentId(contentId: Uint8Array): Uint8Array {
    return contentId.slice(0, SUI_ADDRESS_LENGTH);
}

export function extractContentHashBytes(contentId: Uint8Array): Uint8Array {
    return contentId.slice(SUI_ADDRESS_LENGTH);
}

type SuiError = {
    message: string;
    code: number | null;
};

export function parseSuiError(error: any): SuiError {
    if (!error) {
        return { message: "Unknown error", code: null };
    }

    try {
        if (typeof error.message === 'string' && error.message.startsWith('{')) {
            return JSON.parse(error.message);
        }
    } catch (_) {
    }

    const errorMessage = error.message || error.toString();

    const moveAbortMatch = errorMessage.match(/MoveAbort\(.*?, (\d+)\)/);
    if (moveAbortMatch && moveAbortMatch[1]) {
        return {
            message: errorMessage,
            code: moveAbortMatch[1]
        };
    }

    const errorCodeMatch = errorMessage.match(/E[A-Za-z]+/);
    const errorCode = errorCodeMatch ? errorCodeMatch[0] : null;

    return {
        message: errorMessage,
        code: parseInt(errorCode, 10) || null
    };
}

export function formatTime(timestamp: number | string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };
    return date.toLocaleString("en-US", options);
}