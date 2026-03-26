import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  delay?: number; // milliseconds before showing this message
}

interface ChatDiscussionProps {
  messages: ChatMessage[];
  isAnimating?: boolean;
  backgroundColor?: string;
  style?: 'whatsapp' | 'imessage' | 'messenger';
}

const avatarColors = {
  mère: 'bg-pink-500',
  père: 'bg-blue-500',
  amie: 'bg-purple-500',
  ami: 'bg-green-500',
  default: 'bg-gray-500',
};

function getAvatarColor(name: string): string {
  const lower = name.toLowerCase();
  return (avatarColors[lower as keyof typeof avatarColors] || avatarColors.default);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ChatDiscussion({
  messages,
  isAnimating = true,
  backgroundColor = 'bg-gradient-to-b from-gray-100 to-white',
  style = 'whatsapp',
}: ChatDiscussionProps) {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [visibleMessages]);

  // Animate messages
  useEffect(() => {
    if (!isAnimating) {
      // Show all messages immediately
      setVisibleMessages(messages.map(m => m.id));
      return;
    }

    const queue = [...messages];
    let currentDelay = 0;

    const showMessage = (messageId: string, nextDelay: number) => {
      setTimeout(() => {
        setVisibleMessages(prev => {
          if (!prev.includes(messageId)) {
            return [...prev, messageId];
          }
          return prev;
        });
      }, currentDelay);

      currentDelay += nextDelay;
    };

    queue.forEach((msg, index) => {
      const delay = msg.delay || 1200; // Default 1.2s between messages
      const nextDelay = queue[index + 1]?.delay || 1200;
      showMessage(msg.id, nextDelay);
    });
  }, [messages, isAnimating]);

  // WhatsApp style
  if (style === 'whatsapp') {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full ${backgroundColor} rounded-lg overflow-y-auto p-4 space-y-3 flex flex-col`}
      >
        {/* Header mockup */}
        <div className="sticky top-0 bg-white/80 backdrop-blur pb-3 mb-2 -mx-4 px-4 pt-2 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {getInitials(messages[0]?.senderName || 'Chat')}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {messages[0]?.senderName || 'Discussion'}
              </div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col gap-2">
          {messages.map((msg) => {
            const isVisible = visibleMessages.includes(msg.id);
            const isMine = msg.sender === 'me';

            return (
              <div
                key={msg.id}
                className={`flex gap-2 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                } ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for others */}
                {!isMine && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(
                      msg.senderName
                    )}`}
                  >
                    {getInitials(msg.senderName)}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm leading-5 break-words ${
                    isMine
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Spacer for mine */}
                {isMine && (
                  <div className="w-8 h-8 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer mockup */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur pt-3 -mx-4 px-4 pb-2 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button className="text-blue-500 text-2xl">+</button>
            <input
              type="text"
              placeholder="Aa"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
              disabled
            />
            <button className="text-blue-500 text-xl">🎤</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
