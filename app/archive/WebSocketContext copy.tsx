"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [status, setStatus] = useState(WebSocket.CLOSED);
    const [activeMessageHandlers, setActiveMessageHandlers] = useState({});
    const [onOpenHandlers, setOnOpenHandlers] = useState({});

    useEffect(() => {
        const socket = establishSocketConnection();
        return () => socket.close();
    }, []);

    useEffect(() => {
        if (webSocket) {
            addAllActiveMessageHandlers();
        }
    }, [webSocket]);

    /**
     * @param handleOpen optionally provide an onOpen handler (e.g., send roomId on reconnect)
     * @returns 
     */
    const establishSocketConnection = () => {
        const socket = new WebSocket('wss://yovrwsuqx8.execute-api.us-east-1.amazonaws.com/production/');
        setStatus(() => WebSocket.CONNECTING);
        console.log('xxx')
        socket.onopen = () => {
            console.log('yyy');
            setStatus(() => WebSocket.OPEN);
            const handlers = Object.values(onOpenHandlers);
            if (handlers.length) {
                handlers.forEach((handler) => {
                    handler();
                });
            }
        };
        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            setStatus(() => WebSocket.CLOSED)
        };
        setWebSocket(socket);
        return socket;
    };

    const addAllActiveMessageHandlers = () => {
        const handlers = Object.values(activeMessageHandlers);
        handlers.forEach((handler) => {
            webSocket.addEventListener("message", handler);
        });
    }

    const addMessageHandler = (name, handler) => {
        const adaptedHandler = (event) => {
            const message = JSON.parse(event.data);
            return handler(message);
        };
        setActiveMessageHandlers({ ...activeMessageHandlers, [name]: adaptedHandler });
        if (webSocket) {
            webSocket.addEventListener("message", adaptedHandler);
        }
    };

    const removeMessageHandler = (name) => {
        if (webSocket) {
            const handler = activeMessageHandlers[name];
            webSocket.removeEventListener("message", handler);
            delete activeMessageHandlers[name];
            setActiveMessageHandlers({ ...activeMessageHandlers });
        }
    };

    const addOnOpenHandler = (name, handler) => {
        setOnOpenHandlers({ ...activeMessageHandlers, [name]: handler });
    };

    const removeOnOpenHandler = (name) => {
        delete activeMessageHandlers[name];
        setOnOpenHandlers({ ...activeMessageHandlers });
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
        status,
        addMessageHandler,
        removeMessageHandler,
        sendMessage,
        reconnect: status === WebSocket.CLOSED ? establishSocketConnection : () => console.log('Already connected.'),
        addOnOpenHandler,
        removeOnOpenHandler
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
