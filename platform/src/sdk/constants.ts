import { ChatiwalPackageConfig } from "./types";

export const TESTNET_CHATIWAL_PACKAGE_CONFIG: ChatiwalPackageConfig = {
    chatiwalId: "0x0f26bffd9a6d7ba4401d13b5a90306d9020bb1b8755a8affed10325076ad2cec",
    moduleMessagePrefix: new TextEncoder().encode("chatiwal::message"),
}
export const MAINNET_CHATIWAL_PACKAGE_CONFIG: ChatiwalPackageConfig = {
    chatiwalId: "0x1",
    moduleMessagePrefix: new TextEncoder().encode("chatiwal::message"),
}