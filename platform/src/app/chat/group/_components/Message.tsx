"use client"

import React, { useRef, useState } from 'react';
import { AblyProvider, ChannelProvider, useChannel, useConnectionStateListener } from 'ably/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSealClient } from '@/hooks/useSealClient';
import { MessageBase, SuperMessageNoPolicy } from '@/sdk';
import { random } from "nanoid";
import { toHex } from '@mysten/sui/utils';
import { useWalrusClient } from '@/hooks/useWalrusClient';
import { AblyChannelManager } from '@/libs/ablyHelpers';

interface AblyPubSubProps {
    channelName: string;
}
export function AblyPubSub({ channelName }: AblyPubSubProps) {
    const [messages, setMessages] = useState<MessageBase[]>([]);
    const currentAccount = useCurrentAccount();
    const { encryptMessage, decryptMessage } = useSealClient();
    const { storeMessage } = useWalrusClient();

    useConnectionStateListener('connected', () => {
        console.log('Connected to Ably!');
    });

    // Create a channel called 'get-started' and subscribe to all messages with the name 'first' using the useChannel hook

    const { channel } = useChannel({ channelName }, async (message) => {
        try {
            console.log('Received message:', message);
            // if (message.clientId === currentAccount?.address) {
            //     return;
            // }

            const data = JSON.parse(message.data as string);
            const encryptedMessage = new SuperMessageNoPolicy({
                id: data.id,
                data: {
                    content: data.data.content,
                },
                groupId: data.groupId,
                owner: data.owner,
            });
            const decryptedMessage = await decryptMessage(encryptedMessage);
            setMessages((previousMessages: any) => [...previousMessages, decryptedMessage]);
        } catch (error) {
            console.error('Error decrypting message:', error);
        }
    });

    const handleStoreMessage = async () => {
        if (!currentAccount) {
            return;
        }
        const message = new SuperMessageNoPolicy({
            id: toHex(random(16)),
            data: {
                content: 'Hello, this is a test message!',
            },
            groupId: channelName,
            owner: currentAccount?.address,
        });


        await storeMessage(message, {
            deletable: true,
            epochs: 1,
        });


        console.log('Blob ID:', message.getData());
    }
    const handlePublish = async () => {
        if (!currentAccount) {
            return;
        }
        const message = new SuperMessageNoPolicy({
            data: {
                content: 'Hello, this is a test message!',
            },
            groupId: channelName,
            owner: currentAccount.address,
        })

        try {
            setMessages((previousMessages: any) => [...previousMessages, message]);
            const encrypted = await encryptMessage(message);
            channel.publish('send', JSON.stringify(encrypted));
        } catch (error) {
            console.error('Error publishing message:', error);
        }
    }

    return (
        // Publish a message with the name 'first' and the contents 'Here is my first message!' when the 'Publish' button is clicked
        <div className='flex flex-col gap-4'>
            <button onClick={handlePublish}>
                Publish
            </button>
            {
                messages.map((message: MessageBase) => {
                    return JSON.stringify(message.getData(), null, 2);
                })
            }

            <button onClick={handleStoreMessage}>
                Store Message
            </button>
        </div>
    );
}