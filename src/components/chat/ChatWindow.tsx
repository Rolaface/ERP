import React from 'react';
import { MessageSquare, X } from 'lucide-react';

type ChatWindowProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const ChatWindow = ({ isOpen, onToggle }: ChatWindowProps) => {
  return (
    <>
      {/* FLOATING TOGGLE BUTTON */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
        className="
          fixed
          bottom-6
          right-6
          z-[1000]
          h-14
          w-14
          rounded-full
          bg-blue-600
          text-white
          shadow-2xl
          hover:bg-blue-700
          active:scale-95
          focus:outline-none
          focus:ring-4
          focus:ring-blue-200
          transition-all
          duration-200
          flex
          items-center
          justify-center
        "
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* CHAT PANEL */}
      <div
        className={`
          fixed
          bottom-24
          right-6
          z-[999]
          w-[380px]
          h-[600px]
          bg-white
          rounded-2xl
          shadow-2xl
          border
          border-gray-200
          overflow-hidden
          flex
          flex-col
          transition-all
          duration-300
          origin-bottom-right
          ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }
        `}
      >
        {/* HEADER */}
        <div className="h-14 border-b px-4 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-gray-800">
            AI Assistant
          </h2>

          <button
            onClick={onToggle}
            aria-label="Close chat assistant"
            className="
              text-gray-500
              hover:text-gray-800
              transition-colors
              duration-200
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* MESSAGE AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-100 rounded-xl p-3 text-sm w-fit max-w-[80%]">
            Hello 👋
          </div>

          <div className="bg-blue-600 text-white rounded-xl p-3 text-sm w-fit max-w-[80%] ml-auto">
            Hi there
          </div>
        </div>

        {/* INPUT FOOTER */}
        <div className="border-t p-3 shrink-0 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask something..."
              className="
                flex-1
                border
                rounded-xl
                px-3
                py-2
                text-sm
                outline-none
                focus:ring-2
                focus:ring-blue-500
              "
            />

            <button
              className="
                px-4
                rounded-xl
                bg-blue-600
                text-white
                text-sm
                hover:bg-blue-700
              "
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;