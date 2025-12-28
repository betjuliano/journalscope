import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import SubmissionChat from './SubmissionChat';

/**
 * Botão flutuante de chat que abre o chat da submissão
 */
const ChatButton = ({ submissionId, currentUser, unreadCount = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Botão flutuante */}
            <button
                onClick={() => setIsOpen(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Abrir chat"
            >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Chat</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Modal do chat */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden">
                        <SubmissionChat
                            submissionId={submissionId}
                            currentUser={currentUser}
                            onClose={() => setIsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatButton;
