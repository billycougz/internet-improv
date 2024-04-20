import React from 'react';
import { useWebSocket } from '../WebSocketContext';

const StatusIndicator = () => {
    const socket = useWebSocket();

    let colorClass = '';
    let statusText = '';

    switch (socket.status) {
        case 0:
            colorClass = 'bg-yellow-500';
            statusText = 'Connecting';
            break;
        case 1:
            colorClass = 'bg-green-500';
            statusText = 'Connected';
            break;
        case 3:
            colorClass = 'bg-red-500';
            statusText = 'Disconnected';
            break;
        default:
            colorClass = 'bg-gray-500';
            statusText = 'Unknown';
            break;
    }
    return (
        <div className="flex items-center justify-center h-4">
            <div className={`h-4 w-4 rounded-full mr-2 ${colorClass}`}></div>
            <span>{statusText}</span>
            <button className="ml-8 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded" onClick={null}>Leave Room</button>
        </div>
    );
};

export default StatusIndicator;
