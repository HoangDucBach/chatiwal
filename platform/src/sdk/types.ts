import { SuiClient } from "@mysten/sui/client";
import { ID } from "./classes/utils";

export type ObjectId = string | ID;
export type Address = string;

/**
 * Configuration for the Chatiwal package.
 */
export interface ChatiwalPackageConfig {
    chatiwalId: string;
    registryObjectId: string
}

type SuiClientConfig = {
    suiClient: SuiClient;
};

type ChatiwalNetowrkOrPackageConfig =
    | {
        network: string;
        packageConfig?: never;
    }
    | {
        packageConfig: ChatiwalPackageConfig;
        network?: never;
    };
export type ChatiwalClientConfig = ChatiwalNetowrkOrPackageConfig & SuiClientConfig;