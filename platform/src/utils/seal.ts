// import { TESTNET_CHATIWAL_PACKAGE_CONFIG } from '@/sdk';
// import { Message } from '@/types';
// import { fromHex, toHex } from '@mysten/sui/utils';
// import { SealClient } from '@mysten/seal';

// export function encryptMessage(
//     message: Message,
// ): string {
//     const { chatiwalId } = TESTNET_CHATIWAL_PACKAGE_CONFIG;
//     const encryptedMessage = encrypt({
//         message,
//         publicKey: fromHex(publicKey),
//         privateKey: fromHex(privateKey),
//     });
//     return toHex(encryptedMessage);
// }