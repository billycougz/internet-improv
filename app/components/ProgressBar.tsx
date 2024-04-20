import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

const ProgressBar = ({ totalDuration, startTime, roomData }) => {
    const router = useRouter();

    const [progress, setProgress] = useState(100);
    const [remainingMinutes, setRemainingMinutes] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        const calculateRemainingTime = () => {
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((startTime + totalDuration * 1000 - now) / 1000));
            setRemainingMinutes(Math.floor(diff / 60));
            setRemainingSeconds(diff % 60);
            const timeElapsed = totalDuration - diff;
            const calculatedProgress = (timeElapsed / totalDuration) * 100;
            setProgress(100 - Math.round(calculatedProgress));
        };

        const remainingTimeInterval = setInterval(calculateRemainingTime, 1000);
        calculateRemainingTime();

        return () => {
            clearInterval(remainingTimeInterval);
        };
    }, [startTime, totalDuration]);

    const getColor = () => {
        if (progress > 50) {
            return 'bg-green-500';
        } else if (progress > 20) {
            return 'bg-yellow-500';
        } else {
            return 'bg-red-500';
        }
    };

    const formatTime = (value) => {
        return value < 10 ? `0${value}` : value;
    };

    const handleLeave = () => {
        router.push('/');
    };

    const promptResults = Object.entries(roomData.promptMap || {});

    return (
        <div className="flex items-center w-full">
            <div className="relative flex items-center w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                {startTime && !progress && (
                    <Modal message={`Scene over. You hit ${promptResults.filter(([, hit]) => hit).length} of the ${promptResults.length} prompts!`}
                        buttonText='Return to lobby' onButtonClick={handleLeave} />
                )}
                <div
                    className={`absolute h-full ${getColor()}`}
                    style={{ width: `${progress}%`, right: 0 }}
                ></div>
            </div>
            <div className={`ml-2 w-75 h-8 rounded-full flex items-center justify-center ${getColor()}`} style={{ width: '75px' }}>
                {`${formatTime(remainingMinutes)}:${formatTime(remainingSeconds)}`}
            </div>
        </div>
    );
};

export default ProgressBar;
