"use client";
import StatusIndicator from "./components/StatusIndicator";
import { useWebSocket } from "./WebSocketContext";

export default function AppContainer({ children }) {
    const socket = useWebSocket();
    return (
        <div className="bg-gray-100 min-h-screen">
            <div id="modal-root"></div>
            <div className="max-w-screen-lg mx-auto">
                {/* <div className="container mx-auto fixed inset-x-0 top-0 pt-1 bg-gray-100 max-w-full">
                    <div className="sticky top-0">
                        <StatusIndicator status={socket.status} />
                    </div>
                </div> */}
                {children}
            </div>
        </div>
    )
}