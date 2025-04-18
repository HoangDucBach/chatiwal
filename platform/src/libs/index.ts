export function shortenAddress(address: string, length = 4) {
    if (!address) return '';
    if (address.length <= length * 2 + 2) return address;
    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}