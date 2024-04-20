"use client"
import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "../../WebSocketContext";
import { useRouter, usePathname } from 'next/navigation'
import { generateAiResponse } from '../../openai';
import { notifyRoomJoined, saveRoomToLocalStorage, scrollToBottom } from "../helpers";
import Header from '../../components/Header';
import Modal from "@/app/components/Modal";

export default function Room() {
    const socket = useWebSocket();
    const router = useRouter();
    const roomId = usePathname().split('/rooms/')[1];
    const messagesEndRef = useRef(null);

    const [{ starter, characters }, setScene] = useState({ starter: '', characters: [] });
    const [currentCharacter, setCurrentCharacter] = useState('');
    const [promptMap, setPromptMap] = useState({});
    const [roomData, setRoomData] = useState({});

    const [messageHistory, setMessageHistory] = useState([]);
    const [activeMessages, setActiveMessages] = useState({});
    const [newMessageText, setNewMessageText] = useState('');

    /**
     * On connect/reconnect
     */
    useEffect(() => {
        if (socket.isOpen) {
            notifyRoomJoined({ socket, roomId });
        }
    }, [socket]);

    /**
     * On any roomData change
     */
    useEffect(() => {
        if (socket.isOpen) {
            const removeMessageHandler = socket.addMessageHandler(handleSocketMessage);
            return () => removeMessageHandler();
        }
    }, [socket, newMessageText, messageHistory, activeMessages, currentCharacter]);

    /**
    * On messageHistory change
    */
    useEffect(() => {
        scrollToBottom(messagesEndRef);
    }, [messageHistory]);

    const handleSocketMessage = ({ type, data }) => {
        switch (type) {
            case 'notifyRoomJoined':
                setRoomData(data.roomData);
                setScene(data.roomData.scene);
                setCurrentCharacter(data.character);
                setPromptMap(data.roomData.promptMap);
                setMessageHistory(data.roomData.messageHistory);
                saveRoomToLocalStorage({ roomId, character: data.character });
                break;
            case 'activeMessages':
                const { character, message, timestamp } = data;
                const lastTimestamp = activeMessages[character]?.timestamp || 0;
                if (timestamp > lastTimestamp && character !== currentCharacter) {
                    setActiveMessages(activeMessages => ({ ...activeMessages, [character]: { timestamp, message } }));
                }
                break;
            case 'messageHistory':
                setActiveMessages({ ...activeMessages, [data.character]: '' });
                setMessageHistory(data.messageHistory);
                setPromptMap(data.promptMap);
                setRoomData({ ...roomData, promptMap: data.promptMap });
                break;
        }
    };

    const onNewMessageChange = (event) => {
        const message = event.target.value;
        setNewMessageText(message);
        const updatedMessage = {
            roomId,
            character: currentCharacter,
            timestamp: Date.now(),
            message
        };
        // Uncomment below to enable activeMessage character streaming
        // socket.sendMessage({ type: 'activeMessages', data: updatedMessage });
    };

    const handleSendClick = async () => {
        if (!newMessageText) return;
        socket.sendMessage({
            type: 'messageHistory',
            data: {
                roomId,
                newMessage: {
                    character: currentCharacter,
                    message: newMessageText
                }
            }
        });
        setNewMessageText('');
        setActiveMessages({ ...activeMessages, [currentCharacter]: {} });
    };

    const handleAiClick = async () => {
        const aiResponse = await generateAiResponse({ starter, characters, messages: messageHistory });
        socket.sendMessage({
            type: 'messageHistory',
            data: {
                roomId,
                newMessage: aiResponse
            }
        });
    };

    return (
        <div>
            <Header promptMap={promptMap} roomData={roomData} />
            {/* <div className="container mx-auto fixed inset-x-0 top-5 bg-gray-100 max-w-full p-4">
                <div className="sticky top-0">
                    <h1>{starter}</h1>
                </div>
            </div> */}

            <div className='px-4 lg:px-8 py-4'>

                <div className="bg-gray-700 text-white p-8 rounded-lg shadow-lg">
                    <p className="text-3xl font-semibold mb-4 leading-snug">The Scene</p>
                    <p className="text-lg leading-relaxed">{starter}</p>
                </div>

                <div className="flex-1 overflow-auto mb-10 mt-4">
                    {messageHistory.map((message, index) => message.isPrompt ? message.prompt : (
                        <div key={index} className={`flex flex-col items-${message.character === currentCharacter ? 'end' : 'start'} mb-2`}>
                            <span className={`text-xs ${message.character === currentCharacter ? 'text-blue-400' : 'text-gray-600'}`}>
                                {message.character}
                            </span>
                            <div className={`p-2 rounded-lg text-white ${message.character === currentCharacter ? 'bg-blue-400' : 'bg-gray-800'}`}>
                                {message.message}
                            </div>
                        </div>
                    ))}
                    {Object.entries(activeMessages)
                        .filter(([character, message], index) => message.message && character !== currentCharacter)
                        .map(([character, message], index) => message.isPrompt ? message.prompt : (
                            <div key={index} className={`flex flex-col items-${message.character === currentCharacter ? 'end' : 'start'} mb-2`}>
                                <span className={`text-xs ${message.character === currentCharacter ? 'text-blue-400' : 'text-gray-600'}`}>
                                    {character}
                                </span>
                                <div className={`p-2 rounded-lg text-white ${message.character === currentCharacter ? 'bg-blue-400' : 'bg-gray-800'}`}>
                                    {message.message}
                                </div>
                            </div>
                        ))}
                    <div ref={messagesEndRef} className="mt-5" />
                </div>

                <div className="container mx-auto fixed inset-x-0 bottom-0 pb-4 px-4 bg-gray-100 max-w-full">
                    <div className="sticky bottom-0 bg-white border-t border-gray-300 rounded-lg p-2">
                        <div className="flex items-center">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 outline-none px-2 py-1 text-sm text-black"
                                value={newMessageText}
                                onChange={onNewMessageChange}
                            />
                            <button onClick={handleSendClick} className="ml-2 bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold">↑</button>
                            <button onClick={() => handleAiClick()} className="ml-2 bg-blue-800 text-white rounded-full px-3 py-1 text-sm font-semibold">AI Reply</button>
                            {/*  <button onClick={() => handleAiClick(true)} className="ml-2 bg-blue-800 text-white rounded-full px-3 py-1 text-sm font-semibold">AI Prompt</button> */}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
