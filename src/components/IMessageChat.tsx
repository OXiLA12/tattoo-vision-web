import { useState, useEffect, useRef } from 'react';
import type { ChatMsg } from './WhatsAppChat';

interface iMessageChatProps {
  contactName: string;
  contactAvatar?: string;
  messages: ChatMsg[];
  isPlaying: boolean;
  onDone?: () => void;
}

function Avatar({ name, url, size = 60 }: { name: string; url?: string; size?: number }) {
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#FFB347'];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover mx-auto"
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold mx-auto"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start items-end gap-2 px-4 mb-1">
      <div
        className="flex items-center gap-[5px] px-4 py-3"
        style={{
          background: '#E9E9EB',
          borderRadius: '18px 18px 18px 4px',
          minWidth: 56,
          height: 36,
        }}
      >
        {[0,1,2].map(i => (
          <span
            key={i}
            style={{
              display: 'block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#8E8E93',
              animation: `imsg-bounce 1.2s ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function IMessageChat({
  contactName,
  contactAvatar,
  messages,
  isPlaying,
  onDone,
}: iMessageChatProps) {
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown, typing]);

  useEffect(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setShown([]);
    setTyping(false);

    if (!isPlaying) return;

    let cursor = 0;

    messages.forEach((msg, idx) => {
      if (msg.from === 'them') {
        const t1 = setTimeout(() => setTyping(true), cursor);
        timerRefs.current.push(t1);
        cursor += 900;
      }
      const t2 = setTimeout(() => {
        setTyping(false);
        setShown(prev => [...prev, msg.id]);
        if (idx === messages.length - 1) onDone?.();
      }, cursor);
      timerRefs.current.push(t2);
      cursor += msg.delay;
    });

    return () => timerRefs.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, messages]);

  // group consecutive messages from same sender
  const grouped: { sender: 'me' | 'them'; msgs: ChatMsg[] }[] = [];
  for (const msg of messages) {
    const last = grouped[grouped.length - 1];
    if (last && last.sender === msg.from) {
      last.msgs.push(msg);
    } else {
      grouped.push({ sender: msg.from, msgs: [msg] });
    }
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: 393,
        height: 852,
        fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        background: '#FFFFFF',
        position: 'relative',
      }}
    >
      {/* ── iOS Status Bar (white) ── */}
      <div
        style={{ background: '#F2F2F7', height: 54, paddingTop: 14 }}
        className="flex items-end justify-between px-6 pb-2 flex-shrink-0"
      >
        <span className="text-black text-[15px] font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="17" height="12" viewBox="0 0 17 12" fill="black">
            <rect x="0" y="7" width="3" height="5" rx="0.5"/>
            <rect x="4.5" y="5" width="3" height="7" rx="0.5"/>
            <rect x="9" y="3" width="3" height="9" rx="0.5"/>
            <rect x="13.5" y="0" width="3" height="12" rx="0.5"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="black">
            <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
            <path d="M8 6C5.8 6 3.8 6.9 2.3 8.4l1.4 1.4C4.9 8.7 6.3 8 8 8s3.1.7 4.3 1.8l1.4-1.4C12.2 6.9 10.2 6 8 6z"/>
            <path d="M8 2.5C4.7 2.5 1.7 3.9 0 6.2l1.5 1.3C2.9 5.4 5.3 4 8 4s5.1 1.4 6.5 3.5L16 6.2C14.3 3.9 11.3 2.5 8 2.5z"/>
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="relative w-[25px] h-[12px] rounded-[3px] border-[1.5px] border-black">
              <div className="absolute inset-[1px] rounded-[1.5px] bg-black" style={{width:'80%'}}/>
            </div>
            <div className="w-[2px] h-[5px] rounded-r-sm bg-black opacity-40"/>
          </div>
        </div>
      </div>

      {/* ── iMessage Header ── */}
      <div
        style={{ background: '#F2F2F7', borderBottom: '1px solid #C6C6C8' }}
        className="flex flex-col items-center pb-3 px-4 flex-shrink-0 relative"
      >
        {/* back arrow + new message */}
        <div className="absolute left-4 top-1 flex items-center gap-1">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M8.5 1L1.5 8l7 7" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[#007AFF] text-[17px]">Messages</span>
        </div>
        <div className="absolute right-4 top-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#007AFF">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>

        {/* avatar + name */}
        <div className="mt-1">
          <Avatar name={contactName} url={contactAvatar} size={56} />
        </div>
        <div className="text-[13px] text-black font-semibold mt-1">{contactName}</div>
        <div className="text-[12px] text-[#007AFF] mt-0.5">ℹ️</div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2 flex flex-col gap-[1px]"
        style={{ background: '#FFFFFF' }}
      >
        {/* timestamp */}
        <div className="text-center text-[12px] text-[#8E8E93] mb-3 mt-1">
          Aujourd'hui {messages[0]?.time || '14:00'}
        </div>

        {grouped.map((group, gIdx) => {
          const isMine = group.sender === 'me';
          const visibleMsgs = group.msgs.filter(m => shown.includes(m.id));
          if (visibleMsgs.length === 0) return null;

          return (
            <div key={gIdx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-1 px-2`}>
              {visibleMsgs.map((msg, mIdx) => {
                const isFirst = mIdx === 0;
                const isLast = mIdx === visibleMsgs.length - 1;
                // bubble shape
                const br = isMine
                  ? isFirst && isLast
                    ? '18px 18px 4px 18px'
                    : isFirst
                    ? '18px 18px 14px 18px'
                    : isLast
                    ? '18px 18px 4px 14px'
                    : '18px 18px 14px 14px'
                  : isFirst && isLast
                  ? '18px 18px 18px 4px'
                  : isFirst
                  ? '18px 18px 18px 14px'
                  : isLast
                  ? '4px 18px 18px 14px'
                  : '14px 18px 18px 14px';

                return (
                  <div
                    key={msg.id}
                    className="max-w-[72%] px-4 py-[9px] text-[16px] leading-[1.35]"
                    style={{
                      background: isMine ? '#007AFF' : '#E9E9EB',
                      color: isMine ? '#FFFFFF' : '#000000',
                      borderRadius: br,
                      marginBottom: 2,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })}

              {/* "Lu" under last sent message */}
              {isMine && gIdx === grouped.length - 1 && visibleMsgs.length > 0 && (
                <span className="text-[11px] text-[#8E8E93] mt-1 mr-1">
                  Lu {visibleMsgs[visibleMsgs.length - 1].time}
                </span>
              )}
            </div>
          );
        })}

        {typing && <TypingBubble />}
        <div style={{ height: 8 }} />
      </div>

      {/* ── Footer ── */}
      <div
        className="flex items-end gap-2 px-3 py-2 flex-shrink-0"
        style={{ background: '#F2F2F7', borderTop: '1px solid #C6C6C8' }}
      >
        {/* apps icon */}
        <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13.5" stroke="#007AFF" strokeWidth="1"/>
            <path d="M14 8v12M8 14h12" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* input */}
        <div
          className="flex-1 min-h-[36px] flex items-center px-4 text-[16px]"
          style={{
            background: '#FFFFFF',
            border: '1px solid #C6C6C8',
            borderRadius: 20,
            color: '#8E8E93',
          }}
        >
          iMessage
        </div>

        {/* send */}
        <button
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: '#007AFF' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>

      {/* home indicator */}
      <div className="flex items-center justify-center flex-shrink-0" style={{ background: '#F2F2F7', height: 30 }}>
        <div className="w-32 h-1 rounded-full bg-black/20"/>
      </div>

      <style>{`
        @keyframes imsg-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
