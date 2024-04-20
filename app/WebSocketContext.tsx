"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import Modal from './components/Modal';

const WebSocketContext = createContext({});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [status, setStatus] = useState<0 | 1 | 2 | 3>(WebSocket.CONNECTING);

    useEffect(() => {
        const socket = establishSocketConnection();
        return () => socket.close();
    }, []);

    const establishSocketConnection = () => {
        setStatus(() => WebSocket.CONNECTING);
        const socket = new WebSocket('wss://yovrwsuqx8.execute-api.us-east-1.amazonaws.com/production/');
        socket.addEventListener("open", () => {
            setStatus(() => WebSocket.OPEN);
        });
        socket.addEventListener("close", (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            setStatus(() => WebSocket.CLOSED);
        });
        setWebSocket(socket);
        return socket;
    };

    const addMessageHandler = (handler) => {
        if (webSocket) {
            const adaptedHandler = (event) => {
                const message = JSON.parse(event.data);
                return handler(message);
            }
            webSocket.addEventListener('message', adaptedHandler);
            return () => {
                webSocket.removeEventListener('message', adaptedHandler);
            };
        }
    };

    const sendMessage = ({ type, data }) => {
        const message = {
            action: 'sendmessage',
            message: JSON.stringify({ type, data })
        };
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify(message));
        }
    };

    const value = {
        ...webSocket,
        status,
        isOpen: webSocket && webSocket.readyState === WebSocket.OPEN,
        addMessageHandler,
        sendMessage,
        reconnect: status === WebSocket.CLOSED ? establishSocketConnection : () => console.log('Already connected.')
    };

    return (
        <WebSocketContext.Provider value={value}>
            {status === WebSocket.CLOSED && <Modal message="Your connection dropped." buttonText='Reconnect' onButtonClick={establishSocketConnection} />}
            {children}
        </WebSocketContext.Provider>
    );
};
