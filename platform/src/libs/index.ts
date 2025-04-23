export function shortenAddress(address: string, length = 4) {
    if (!address) return '';
    if (address.length <= length * 2 + 2) return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function formatBalance(balance: bigint, decimals = 9): string {
    const divisor = 10n ** BigInt(decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;

    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 3);
    return `${whole}.${fractionStr}`;
}