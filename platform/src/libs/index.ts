export function shortenAddress(address: string, length = 4) {
    if (!address) return '';
    if (address.length <= length * 2 + 2) return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

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

export function encode(object: any) {
    const buffer = Buffer.from(JSON.stringify(object));
    const asBytes = new Uint8Array(buffer);
    return asBytes;
}

export function decode(bytes: Uint8Array) {
    const buffer = Buffer.from(bytes);
    const asString = buffer.toString();
    return JSON.parse(asString);
}