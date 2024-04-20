import React from 'react';

const Messages = ({ activeMessages }) => {
    const messages = Object.entries(activeMessages).map(([character, { message }]) => ({ character, message }));
    return (
        <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
                <div key={index} className="bg-gray-200 rounded-lg p-4">
                    <div className="font-semibold">{message.character}</div>
                    <div>{message.message}</div>
                </div>
            ))}
        </div>
    );
};

export default Messages;
