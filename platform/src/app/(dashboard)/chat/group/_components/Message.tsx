"use client"

import React, { useState } from 'react';
import { Message } from '@ably/chat';
import { useMessages } from '@ably/chat/react';

// This is a simple chat component that uses the useMessages hook in Ably Chat to send and receive messages.
export function Messages() {

    // Setup some state for the messages and a listener for chat messages using the useMessages hook
    const [message, setMessage] = useState('My first message with Ably Chat!');
    const [messages, setMessages] = useState<Message[]>([]);
    const { send, get } = useMessages(
        {
            listener: (event) => {
                console.log('received message', event.message);
                setMessages(prev => [...prev, event.message]);
            }
        }
    );

    // This function takes the message from the input field and sends it to the chat using the send function
    // returned from the useMessages hook
    const handleSend = async () => {
        try {
            await send({ text: message });
            console.log('sent message', message);
            setMessage(''); // Clear input after successful send
        } catch (error) {
            console.error('error sending message', error);
        }
    };

    // This is a very simple UI that displays the messages and a text input for sending messages.
    return (
        <div style={{
            maxWidth: '600px',
            minWidth: '400px',
            margin: '20px auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Container for the messages */}
            <div className="messages-container" style={{
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f8f9fa'
            }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className="message"
                        style={{
                            backgroundColor: 'white',
                            padding: '10px 15px',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            maxWidth: '80%'
                        }}
                    >
                        {/* Display the message timestamp and text */}
                        <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px' }}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                        <div>
                            {msg.clientId}
                        </div>
                        <div style={{ wordBreak: 'break-word', color: '#333' }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="input-container" style={{
                display: 'flex',
                gap: '10px'
            }}>
                {/* Input field for sending messages */}
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                        fontSize: '16px'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                {/* Button for sending messages */}
                <button
                    onClick={handleSend}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}