export const notifyRoomJoined = ({ socket, roomId }) => {
    const character = JSON.parse(window.localStorage.getItem('improv-rooms') || '{}')?.[roomId]?.['character'];
    const message = {
        type: 'notifyRoomJoined',
        data: {
            roomId,
            character
        }
    };
    socket.sendMessage(message);
};

export const scrollToBottom = (messagesEndRef) => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

export function saveRoomToLocalStorage({ roomId, character }) {
    const KEY = 'improv-rooms';
    const storedRooms = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    storedRooms[roomId] = storedRooms[roomId] || {};
    storedRooms[roomId]['character'] = character;
    window.localStorage.setItem(KEY, JSON.stringify(storedRooms));
}