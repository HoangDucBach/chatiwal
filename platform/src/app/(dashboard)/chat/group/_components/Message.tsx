"use client"

import React, { useRef, useState } from 'react';
import { AblyProvider, ChannelProvider, useChannel, useConnectionStateListener } from 'ably/react';
import { ChatiwalMessageType, type ChatiwalEncryptedMessage, type MessageNoPolicy } from '@/types';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSealClient } from '@/hooks/useSealClient';

interface AblyPubSubProps {
    channelName: string;
}
export function AblyPubSub({ channelName }: AblyPubSubProps) {
    const [messages, setMessages] = useState<any>([]);
    const currentAccount = useCurrentAccount();
    const { encryptMessage, decryptMessage } = useSealClient();
    const localSentMessages = useRef<Record<string, MessageNoPolicy>>({});

    useConnectionStateListener('connected', () => {
        console.log('Connected to Ably!');
    });

    // Create a channel called 'get-started' and subscribe to all messages with the name 'first' using the useChannel hook

    const { channel } = useChannel({ channelName }, 'send', async (message) => {
        const data = message.data as ChatiwalEncryptedMessage;
        try {
            console.log('Received message:', message);
            if (message.clientId === currentAccount?.address) {
                return;
            }
            const decryptedMessage = localSentMessages.current[data.id] || await decryptMessage(data);
            setMessages((previousMessages: any) => [...previousMessages, decryptedMessage]);
        } catch (error) {
            console.error('Error decrypting message:', error);
        }
    });

    const handlePublish = async () => {
        if (!currentAccount) {
            return;
        }

        const message: MessageNoPolicy = {
            owner: currentAccount.address,
            content: {
                text: 'Here is my first message!Here is my first message!Here is my first message!Here is my first message!Here is my first message!Here is my first message!Here is my first message!Here is my first message!',
            },
            type: ChatiwalMessageType.NO_POLICY,
            id: crypto.getRandomValues(new Uint8Array(3)).toString(),
            groupId: channelName,
            createdAt: new Date(),
        };
        localSentMessages.current[message.id] = message;

        try {
            const encrypted = await encryptMessage(message);
            channel.publish('send', encrypted);
            setMessages((previousMessages: any) => [...previousMessages, message]);
        } catch (error) {
            console.error('Error publishing message:', error);
        }
    }

    return (
        // Publish a message with the name 'first' and the contents 'Here is my first message!' when the 'Publish' button is clicked
        <div>
            <button onClick={handlePublish}>
                Publish
            </button>
            {
                messages.map((message: MessageNoPolicy) => {
                    return JSON.stringify(message, null, 2);
                })
            }
        </div>
    );
}