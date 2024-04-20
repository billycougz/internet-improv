const setWindowHandlers = () => {
    const handleTimeout = (message) => {
        const newTimeout = setTimeout(() => {
            socket.sendMessage({
                type: 'messageHistory',
                data: {
                    roomId,
                    newMessage: {
                        character: currentCharacter,
                        message
                    }
                }
            });
            setNewMessageText('');
            setActiveMessages({ ...activeMessages, [currentCharacter]: {} });
        }, 3000);
        setResetTextTimeout(resetTextTimeout => {
            window.clearTimeout(resetTextTimeout);
            return newTimeout;
        });
    };

    window.addEventListener('keypress', keypressHandler);
    return () => window.removeEventListener('keypress', keypressHandler);
};