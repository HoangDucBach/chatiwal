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

export function generateColorFromAddress(addr: string): string {
    const clean = addr.startsWith('0x') ? addr.slice(2) : addr;
    const hash = parseInt(clean.slice(0, 6), 16);
    const hue = hash % 360;
    const saturation = 60 + (hash % 20); // 60–80%
    const lightness = 50 + (hash % 20); // 50–70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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