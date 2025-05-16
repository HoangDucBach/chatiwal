import { ChatiwalPackageConfig } from "./types";

export const TESTNET_CHATIWAL_PACKAGE_CONFIG: ChatiwalPackageConfig = {
    chatiwalId: "0x04aa9f11f8fa6f02684c1a6f2becc4ada0c91da74b7a024db45b3fa586794e08",
    moduleMessagePrefix: new TextEncoder().encode("chatiwal::message"),
}
export const MAINNET_CHATIWAL_PACKAGE_CONFIG: ChatiwalPackageConfig = {
    chatiwalId: "0x1",
    moduleMessagePrefix: new TextEncoder().encode("chatiwal::message"),
}