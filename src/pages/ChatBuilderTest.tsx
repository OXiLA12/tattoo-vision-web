import { useState } from 'react';
import WhatsAppChat from '../components/WhatsAppChat';
import IMessageChat from '../components/IMessageChat';
import type { ChatMsg } from '../components/WhatsAppChat';

const MSGS: ChatMsg[] = [
  { id: '1', from: 'them', text: "T'as un tatouage ?! 😱",        time: '14:23', delay: 500 },
  { id: '2', from: 'me',   text: 'Oui pourquoi 😅',               time: '14:24', delay: 1500, read: true },
  { id: '3', from: 'them', text: "C'EST PERMANENT ?!?!",           time: '14:24', delay: 1200 },
  { id: '4', from: 'me',   text: "Bah c'est un tatouage maman...", time: '14:25', delay: 2000, read: true },
  { id: '5', from: 'them', text: 'JE SUIS TELLEMENT DÉÇUE 😭😭',  time: '14:25', delay: 1500 },
  { id: '6', from: 'me',   text: "Mais t'aimes pas ? 😢",         time: '14:26', delay: 1800, read: true },
  { id: '7', from: 'them', text: "Si... c'est stylé en fait 😂❤️", time: '14:26', delay: 2000 },
];

export default function ChatBuilderTest() {
  const [style, setStyle] = useState<'whatsapp' | 'imessage'>('whatsapp');
  const [playKey, setPlayKey] = useState(0);  // incrementing key forces full remount

  const play = () => setPlayKey(k => k + 1);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex gap-3">
        <button
          onClick={() => setStyle('whatsapp')}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${style==='whatsapp' ? 'bg-[#25D366] text-white' : 'bg-white/10 text-white'}`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setStyle('imessage')}
          className={`px-4 py-2 rounded-xl font-bold text-sm ${style==='imessage' ? 'bg-[#007AFF] text-white' : 'bg-white/10 text-white'}`}
        >
          iMessage
        </button>
        <button onClick={play} className="px-4 py-2 rounded-xl font-bold text-sm bg-purple-600 text-white">
          ▶ Play
        </button>
      </div>

      {/* Phone frame */}
      <div
        style={{
          borderRadius: 44,
          overflow: 'hidden',
          boxShadow: '0 0 0 10px #1a1a1a, 0 0 0 12px #333, 0 40px 80px rgba(0,0,0,0.8)',
        }}
      >
        {style === 'whatsapp' ? (
          <WhatsAppChat
            key={playKey}
            contactName="Maman 👩‍👦"
            contactStatus="en ligne"
            messages={MSGS}
            isPlaying={playKey > 0}
            onDone={() => {}}
          />
        ) : (
          <IMessageChat
            key={playKey}
            contactName="Maman 👩‍👦"
            messages={MSGS}
            isPlaying={playKey > 0}
            onDone={() => {}}
          />
        )}
      </div>
    </div>
  );
}
