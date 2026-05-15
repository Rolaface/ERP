import React, { useEffect, useRef } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { sendMessage } from "../../api/chatApi"

type ChatWindowProps = {
  isOpen: boolean;
  onToggle: () => void;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const ChatWindow = ({ isOpen, onToggle }: ChatWindowProps) => {

  // STEP 5.1B — Local Messages State
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello 👋',
    },
  ]);

  // STEP 5.1C — Input State
  const [input, setInput] = React.useState('');

  // STEP 5.3A — Create Scroll Ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // STEP 5.3B — Auto Scroll Effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  // STEP 5.2A — Create Send Function
  // STEP 6.2 — Backend Request Function
  const handleSendMessage = async () => {

    const trimmedInput = input.trim();

    // Prevent empty messages
    if (!trimmedInput) return;

    // Stable message snapshot
    const userMessage = trimmedInput;

    // Create local user message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    // Render user message immediately
    setMessages((prev) => [...prev, newMessage]);

    // Clear input instantly
    setInput('');

    try {

      // API Request
      const response = await sendMessage({
        message: userMessage,
      });

      // Assistant reply message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
      };

      // Render assistant reply
      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);

    } catch (error) {

      console.error('Chat request failed:', error);

      // Friendly fallback message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    }
  };

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
          ${isOpen
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

          {messages.map((message) => (
            <div
              key={message.id}
              className={`
                rounded-xl
                p-3
                text-sm
                max-w-[80%]
                w-fit
                ${message.role === 'assistant'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-600 text-white ml-auto'
                }
              `}
            >
              {message.content}
            </div>
          ))}

          {/* STEP 5.3C — Scroll Anchor */}
          <div ref={messagesEndRef} />

        </div>

        {/* INPUT FOOTER */}
        <div className="border-t p-3 shrink-0 bg-white">
          <div className="flex gap-2">

            {/* CONTROLLED INPUT */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}

              // STEP 5.2C — Enter-to-Send
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}

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

            {/* STEP 5.2B — Connect Send Button */}
            <button
              onClick={handleSendMessage}
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