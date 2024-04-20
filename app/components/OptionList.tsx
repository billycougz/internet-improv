import React from 'react';

const OptionItem = ({ option, onSelect }) => {
    const handleSelect = () => {
        onSelect(option);
    };

    return (
        <div className="flex justify-between items-center bg-transparent">
            <p className="text-base truncate whitespace-no-wrap" style={{ width: 'calc(100% - 80px)' }}>{option}</p>
            <button
                onClick={handleSelect}
                className="px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none"
            >
                Select
            </button>
        </div>
    );
};

const OptionsList = ({ options, onSelect }) => {
    return (
        <div className="grid gap-4 mb-5">
            {options.map((option, index) => (
                <OptionItem key={index} option={option} onSelect={onSelect} />
            ))}
        </div>
    );
};

export default OptionsList;
