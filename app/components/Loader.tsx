import React from 'react';

const Loader = ({ show }) => {
    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${show ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-gray-800 opacity-50"></div>
            <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        </div>
    );
};

export default Loader;
