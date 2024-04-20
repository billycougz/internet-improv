"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "./WebSocketContext";
import { useRouter } from 'next/navigation'
import Loader from "./components/Loader";

export default function Home() {
    const socket = useWebSocket();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (socket) {
            const removeMessageHandler = socket.addMessageHandler(handleSocketMessage);
            return () => {
                if (removeMessageHandler) {
                    removeMessageHandler();
                }
            };
        }
    }, [socket]);

    const handleJoinClick = () => {
        // ToDo: Add loading spinner
        socket.sendMessage({ type: 'joinRoom' });
        setIsLoading(true);
    };

    const handleSocketMessage = ({ type, data }) => {
        if (type === 'joinRoom') {
            router.push(`/rooms/${data.roomId}`);
        }
    };

    return (
        <div>
            <Loader show={isLoading} />
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-semibold mb-2">The AI Improv</h1>
                <p className="mb-4 text-center">Use your imagination to improvise a dialog between yourself and your AI co-star.</p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg" onClick={handleJoinClick}>
                    Start a scene
                </button>
            </div>
        </div>
    )
}