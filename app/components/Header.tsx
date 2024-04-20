import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

const Header = ({ promptMap, roomData }) => {
    const router = useRouter();
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const buttons = Object.keys(promptMap).sort((a, b) => {
        const valueA = promptMap[a];
        const valueB = promptMap[b];

        if (valueA === false && valueB === true) {
            return -1; // false comes before true
        } else if (valueA === true && valueB === false) {
            return 1; // true comes after false
        } else {
            return 0; // both are either true or false, maintain original order
        }
    });

    const onLeaveClick = () => {
        setShowLeaveModal(true);
    }

    const handleLeave = () => {
        router.push('/');
    };

    const promptResults = Object.entries(roomData.promptMap || {});

    return (
        <header className="sticky top-0">
            {/* Top layer */}
            <div className="flex justify-between items-center bg-gray-800 py-4 lg:py-6 px-4 space-x-4 text-white ">
                <div className="flex w-full">
                    <ProgressBar roomData={roomData || {}} startTime={roomData.startTime || 0} totalDuration={roomData.sceneDuration * 60 || 0} />
                </div>
                <button onClick={onLeaveClick}>
                    Leave
                </button>
                {showLeaveModal && <Modal message="Leave the scene?" buttonText='Leave' cancelButtonText='Cancel' onCancelClick={() => setShowLeaveModal(false)} onButtonClick={handleLeave} />}
            </div>
            {/* Bottom layer */}
            <div className="flex bg-gray-700 py-4">
                <div className={`mx-4 p-1 rounded-full flex items-center justify-center text-black bg-white`}>
                    {`${promptResults.filter(([, hit]) => hit).length}/${promptResults.length}`}
                </div>
                <div className="lg:hidden overflow-x-scroll whitespace-nowrap scrollbar-hidden px-4">
                    {buttons.map((button, index) => (
                        <button key={index} className={`inline-block px-2 py-1 mr-2 text-white rounded ${promptMap[button] ? 'bg-gray-800' : 'bg-gray-600'}`}>
                            {button}
                        </button>
                    ))}
                </div>

            </div>
        </header>
    );
};

export default Header;
