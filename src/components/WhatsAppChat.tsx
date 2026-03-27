import { useState, useEffect, useRef } from 'react';
import { EmojiProvider, Emoji } from 'react-apple-emojis';
import emojiData from 'react-apple-emojis/src/data.json';
import waBgUrl from '../assets/wa-bg-light.png';

// ── Map Unicode → nom Apple ──────────────────────────────────────────────────
const fileToChar = (filename: string): string => {
  try {
    const codeStr = filename.replace('.png', '').split('_').pop()!;
    const codePoints = codeStr.split('-').map(c => parseInt(c, 16));
    return String.fromCodePoint(...codePoints);
  } catch { return ''; }
};

const EMOJI_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [name, file] of Object.entries(emojiData.emojis as Record<string, string>)) {
    const char = fileToChar(file);
    if (char) map[char] = name;
  }
  return map;
})();

function parseEmojis(text: string, size = 19): React.ReactNode[] {
  const segmenter = new Intl.Segmenter('fr', { granularity: 'grapheme' });
  const segments  = Array.from(segmenter.segment(text));
  const result: React.ReactNode[] = [];
  let buffer = '';
  let key = 0;
  for (const { segment } of segments) {
    const name = EMOJI_MAP[segment];
    if (name) {
      if (buffer) { result.push(buffer); buffer = ''; }
      result.push(<Emoji key={key++} name={name} width={size} style={{ display: 'inline', verticalAlign: '-3px', margin: '0 1px' }} />);
    } else {
      buffer += segment;
    }
  }
  if (buffer) result.push(buffer);
  return result;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type MsgType = 'text' | 'image' | 'youtube';

export interface ChatMsg {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
  delay: number;
  read?: boolean;
  type?: MsgType;
  imageUrl?: string;   // data URL ou URL distante pour les images
  youtubeId?: string;  // ID de la vidéo YouTube (ex: "dQw4w9WgXcQ")
  youtubeTitle?: string;
  isYesterday?: boolean; // Pour afficher la bulle dans une section "Hier"
}

interface WhatsAppChatProps {
  contactName: string;
  contactAvatar?: string;
  contactStatus?: string;
  messages: ChatMsg[];
  isPlaying: boolean;
  onDone?: () => void;
}

// ── Couleurs WhatsApp iOS dark mode (exact) ───────────────────────────────────
const C = {
  bgMain:    '#000000',   // noir pur iOS
  bgPanel:   'rgba(31, 44, 52, 0.65)',   // bulles reçues (glassmorphism)
  bgSent:    'rgba(0, 92, 75, 0.65)',    // bulles envoyées (glassmorphism)
  bgHeader:  '#000000',   // header + footer iOS noir pur
  text:      '#E9EDEF',   // texte principal
  textSub:   '#8696A0',   // heure, texte secondaire
  tickBlue:  '#53BDEB',   // double coche bleue (lu)
  tickGrey:  '#8696A0',   // coche grise (envoyé/reçu)
  inputBg:   '#1C1C1E',   // champ de saisie iOS
  dividerBg: '#1A1A1A',
  green:     '#25D366',   // vert WhatsApp
  greenSent: '#00A884',
};

// ── iOS Status Bar: utilise une image PNG pixel-perfect ───────────────────────

// ── Sous-composants ──────────────────────────────────────────────────────────
function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  const colors = ['#00A884','#0078D4','#9C27B0','#F44336','#FF9800'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  if (url) return <img src={url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ReadTicks({ read }: { read?: boolean }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="inline-block ml-0.5 flex-shrink-0" style={{ verticalAlign: '-1px' }}>
      <path d="M1 5.5L4.5 9L10.5 2"  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: read ? 'tick-blue-anim 1.2s forwards' : 'none', stroke: C.tickGrey }} />
      <path d="M5.5 5.5L9 9L15 2"    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: read ? 'tick-blue-anim 1.2s forwards' : 'none', stroke: C.tickGrey }} />
    </svg>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start px-2 mb-1">
      <div className="flex items-center gap-[5px] px-4 py-3 rounded-[18px] rounded-tl-[4px] shadow-sm"
        style={{ background: C.bgPanel }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="block w-[7px] h-[7px] rounded-full"
            style={{ background: C.textSub, animation: `wa-bounce 1.2s ${i * 0.22}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ── Clavier iOS (CSS pur, réaliste 100% fidèle au screenshot) ─────────────
function IOSKeyboard({ inputText = '' }: { inputText?: string }) {
  const row1 = ['a','z','e','r','t','y','u','i','o','p'];
  const row2 = ['q','s','d','f','g','h','j','k','l','m'];
  const row3 = ['w','x','c','v','b','n','´'];
  
  // Extraction du mot en cours pour les suggestions
  const words = inputText.trim().split(' ');
  const currentWord = inputText.endsWith(' ') ? '' : (words[words.length - 1] || '');
  const lastKey = currentWord.slice(-1).toLowerCase();
  
  // Fake suggestions
  const suggestions = currentWord 
    ? [currentWord, currentWord + 's', currentWord + 'e']
    : ['je', 'tu', "c'est"];

  const Key = ({ w, children, dark, flex }: { w?: string, children: React.ReactNode, dark?: boolean, flex?: string }) => {
    // Si c'est une lettre normale (pas dark) et qu'elle correspond à la dernière lettre tapée, on l'allume
    const isChar = typeof children === 'string' && children.length === 1 && !dark;
    const isPressed = isChar && (children as string).toLowerCase() === lastKey;
    
    return (
      <div className="flex justify-center items-center rounded-[5px] text-white shadow-sm transition-colors duration-75"
           style={{ 
             width: w, flex: flex, height: 43, 
             background: isPressed ? '#8A8A8C' : (dark ? '#383839' : '#5A5A5C'), 
             fontSize: 22, fontWeight: 400, fontFamily: '-apple-system, sans-serif' 
           }}>
        {children}
      </div>
    );
  };

  return (
    <div className="flex-shrink-0 w-full flex flex-col transition-all" style={{ background: '#1A1A1A' }}>
      
      {/* ── Predictive Bar ── */}
      <div className="flex w-full h-[40px] items-center px-1" style={{ background: '#272728' }}>
        <div className="flex-1 flex justify-center items-center text-white/90 text-[15px] tracking-wide transition-all">{suggestions[0]}</div>
        <div className="w-[1px] h-[22px] bg-white/10 rounded-full"></div>
        <div className="flex-1 flex justify-center items-center text-white/90 text-[15px] tracking-wide transition-all">{suggestions[1]}</div>
        <div className="w-[1px] h-[22px] bg-white/10 rounded-full"></div>
        <div className="flex-1 flex justify-center items-center text-white/90 text-[15px] tracking-wide transition-all">{suggestions[2]}</div>
      </div>

      {/* ── Keyboard Keys ── */}
      <div className="flex flex-col gap-[12px] px-[3px] pt-2 pb-1" style={{ background: '#1c1c1e' }}>
        <div className="flex justify-center gap-[6px]">
          {row1.map(k => <Key w="8.6%" key={k}>{k}</Key>)}
        </div>
        <div className="flex justify-center gap-[6px] px-[4.5%]">
          {row2.map(k => <Key w="8.6%" key={k}>{k}</Key>)}
        </div>
        <div className="flex justify-center gap-[6px]">
          <Key w="13%" dark>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4L12 20M12 4L5 11M12 4L19 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Key>
          {row3.map(k => <Key w="8.6%" key={k}>{k}</Key>)}
          <Key w="13%" dark>
            <svg width="24" height="20" viewBox="0 0 24 24" fill="none"><path d="M10.5 6H19C20.1046 6 21 6.89543 21 8V16C21 17.1046 20.1046 18 19 18H10.5C9.80302 18 9.14571 17.6841 8.70711 17.1464L4 12L8.70711 6.85355C9.14571 6.31592 9.80302 6 10.5 6Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/><path d="M13 10L17 14M17 10L13 14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </Key>
        </div>
        <div className="flex gap-[6px]">
          <Key w="24%" dark><span style={{fontSize:16}}>123</span></Key>
          <Key w="11.5%" dark>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/><path d="M8 10V10.1M16 10V10.1M8 15C8 15 9.5 17 12 17C14.5 17 16 15 16 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </Key>
          <div className="flex-1 flex justify-center items-center rounded-[5px] shadow-sm relative"
               style={{ height: 43, background: '#5A5A5C' }}>
            <span className="absolute right-3 text-[10px] text-white/30 font-bold tracking-wider">FR EN</span>
          </div>
          <Key w="24%" dark><span style={{fontSize:16, color: 'rgba(255,255,255,0.4)'}}>retour</span></Key>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="flex w-full justify-between items-center px-6 h-[45px] pb-2" style={{ background: '#1c1c1e' }}>
         <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.2"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.2"/><path d="M2 12H22M12 2V22M4.5 7H19.5M4.5 17H19.5" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round"/></svg>
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4"/><path d="M5 10v1a7 7 0 0014 0v-1M12 18v4M9 22h6" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.4" strokeLinecap="round"/></svg>
      </div>

    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function WhatsAppChat({
  contactName, contactAvatar, contactStatus = 'en ligne',
  messages, isPlaying, onDone,
}: WhatsAppChatProps) {
  const [shown,     setShown]     = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [theyType,  setTheyType]  = useState(false);

  // Helper pour déporter le rendu des messages
  const renderMessage = (msg: ChatMsg) => {
    if (!shown.includes(msg.id)) return null;
    const isMine = msg.from === 'me';
    const msgType = msg.type ?? 'text';

    // ── Bulle image ──────────────────────────────────────────────────
    if (msgType === 'image' && msg.imageUrl) {
      return (
        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-[2px]`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="relative shadow overflow-hidden flex flex-col"
            style={{
              background: isMine ? C.bgSent : C.bgPanel,
              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              maxWidth: 220,
              minWidth: 120,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 1.5px rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '0.5px solid rgba(255,255,255,0.05)',
              animation: isMine ? 'bubble-pop-right 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'bubble-pop-left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}>
            <img src={msg.imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
            {msg.text && (
              <div style={{ padding: '6px 9px 24px 9px' }}>
                <span style={{ color: C.text, fontSize: 15, lineHeight: 1.4, letterSpacing: '-0.1px' }}>{parseEmojis(msg.text)}</span>
              </div>
            )}
            <div className="absolute bottom-[4px] right-[7px] flex items-center gap-[3px]">
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>{msg.time}</span>
              {isMine && <ReadTicks read={msg.read} />}
            </div>
          </div>
        </div>
      );
    }

    // ── Bulle YouTube ─────────────────────────────────────────────────
    if (msgType === 'youtube' && msg.youtubeId) {
      const thumb = `https://img.youtube.com/vi/${msg.youtubeId}/hqdefault.jpg`;
      return (
        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-[2px]`} style={{ position: 'relative', zIndex: 1 }}>
          <div className="relative shadow overflow-hidden flex flex-col"
            style={{
              background: isMine ? C.bgSent : C.bgPanel,
              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              maxWidth: 240,
              minWidth: 200,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 1.5px rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '0.5px solid rgba(255,255,255,0.05)',
              animation: isMine ? 'bubble-pop-right 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'bubble-pop-left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            }}>
            {/* Thumbnail */}
            <div style={{ position: 'relative' }}>
              <img src={thumb} alt="" style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
              {/* Play button overlay */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(0,0,0,0.75)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              {/* YouTube logo */}
              <div style={{ position: 'absolute', bottom: 6, left: 7 }}>
                <svg height="14" viewBox="0 0 71 50" fill="none">
                  <path d="M69.5 7.8a8.8 8.8 0 00-6.2-6.2C57.9 0 35.5 0 35.5 0S13.1 0 7.7 1.6A8.8 8.8 0 001.5 7.8C0 13.2 0 24.5 0 24.5s0 11.3 1.5 16.7a8.8 8.8 0 006.2 6.2C13.1 49 35.5 49 35.5 49s22.4 0 27.8-1.6a8.8 8.8 0 006.2-6.2C71 35.8 71 24.5 71 24.5S71 13.2 69.5 7.8z" fill="#FF0000"/>
                  <path d="M28.4 34.9l18.5-10.4L28.4 14v20.9z" fill="white"/>
                </svg>
              </div>
            </div>
            {/* Title */}
            {msg.youtubeTitle && (
              <div style={{ padding: '5px 9px 4px', borderTop: `1px solid rgba(255,255,255,0.08)` }}>
                <span style={{ color: C.text, fontSize: 13, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                  {msg.youtubeTitle}
                </span>
                <span style={{ color: C.textSub, fontSize: 11, marginTop: 2, display: 'block' }}>youtube.com</span>
              </div>
            )}
            {/* Légende + heure */}
            <div style={{ padding: '2px 7px 20px 9px' }}>
              {msg.text && <span style={{ color: C.text, fontSize: 14.5 }}>{parseEmojis(msg.text)}</span>}
              <div className="absolute bottom-[4px] right-[7px] flex items-center gap-[3px]">
                <span style={{ fontSize: 12, color: C.textSub, whiteSpace: 'nowrap' }}>{msg.time}</span>
                {isMine && <ReadTicks read={msg.read} />}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── Bulle texte (défaut) ──────────────────────────────────────────
    return (
      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-[2px]`} style={{ position: 'relative', zIndex: 1 }}>
        <div className="relative shadow-sm flex flex-col"
          style={{
            background: isMine ? C.bgSent : C.bgPanel,
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            maxWidth: '82%',
            padding: '8px 11px 22px 11px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15), inset 0 1px 1.5px rgba(255,255,255,0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.05)',
            position: 'relative',
            animation: isMine ? 'bubble-pop-right 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'bubble-pop-left 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}>
          {/* Queue bulle */}
          {isMine ? (
            <svg className="absolute -right-[6px] bottom-[6px]" width="9" height="14" viewBox="0 0 9 14" fill="none">
              <path d="M0 0 C3 6 8 10 9 14 C6 13 1 11 0 9 Z" fill={C.bgSent}/>
            </svg>
          ) : (
            <svg className="absolute -left-[6px] bottom-[6px]" width="9" height="14" viewBox="0 0 9 14" fill="none">
              <path d="M9 0 C6 6 1 10 0 14 C3 13 8 11 9 9 Z" fill={C.bgPanel}/>
            </svg>
          )}

          <span style={{ color: C.text, fontSize: 14.5, lineHeight: 1.45, wordBreak: 'break-word' }}>
            {parseEmojis(msg.text)}
          </span>

          {/* Heure + coches */}
          <div className="absolute bottom-[5px] right-[8px] flex items-center gap-[3px]">
            <span style={{ fontSize: 12, color: C.textSub, whiteSpace: 'nowrap' }}>
              {msg.time}
            </span>
            {isMine && <ReadTicks read={msg.read} />}
          </div>
        </div>
      </div>
    );
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const timers    = useRef<number[]>([]);
  // Ref pour tracker si l'animation a déjà été jouée (éviter le reset quand isPlaying repasse à false)
  const hasPlayedRef = useRef(false);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shown, theyType]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!isPlaying) {
      // Ne PAS effacer les messages quand l'animation s'arrête !
      // On les garde visibles à l'écran.
      setInputText('');
      setTheyType(false);
      return;
    }

    // Reset uniquement au DÉMARRAGE d'une nouvelle animation
    setShown([]);
    setInputText('');
    setTheyType(false);
    hasPlayedRef.current = true;

    let t = 0;
    const randomPause = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

    messages.forEach((msg, idx) => {
      const isLast = idx === messages.length - 1;
      
      // Ajout d'une pause humaine aléatoire avant chaque message (ex: temps de réflexion)
      t += randomPause(200, 800);

      if (msg.from === 'me') {
        // Simulation de frappe lettre par lettre dans le champ de saisie
        let charT = t;
        for (let c = 1; c <= msg.text.length; c++) {
          const partial = msg.text.slice(0, c);
          // Vitesse de frappe humaine variable par lettre (+35 à +65ms)
          charT += randomPause(35, 65);
          const t1 = window.setTimeout(() => setInputText(partial), charT);
          timers.current.push(t1);
        }
        // Pause hasardeuse après avoir tapé le message avant de cliquer sur Envoyer
        t = charT + randomPause(250, 600);
        
        const t2 = window.setTimeout(() => {
          setInputText('');
          setShown(prev => [...prev, msg.id]);
          // Attendre 2 secondes supplémentaires après le dernier message avant d'appeler onDone
          if (isLast) {
            const tEnd = window.setTimeout(() => onDone?.(), 2000);
            timers.current.push(tEnd);
          }
        }, t);
        timers.current.push(t2);
      } else {
        const t1 = window.setTimeout(() => setTheyType(true), t);
        timers.current.push(t1);
        // Durée aléatoire pour que "l'autre" tape
        const typingDur = Math.max(900, msg.text.length * 28) + randomPause(100, 600);
        t += typingDur;
        
        const t2 = window.setTimeout(() => {
          setTheyType(false);
          setShown(prev => [...prev, msg.id]);
          if (isLast) {
            const tEnd = window.setTimeout(() => onDone?.(), 2000);
            timers.current.push(tEnd);
          }
        }, t);
        timers.current.push(t2);
      }
      // Délai naturel prévu initialement + micro aléatoire
      t += msg.delay + randomPause(0, 300);
    });
    return () => timers.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const hasInput = inputText.length > 0;

  return (
    <EmojiProvider data={emojiData}>
    <div className="flex flex-col overflow-hidden select-none relative"
      style={{ width: 393, height: 852, fontFamily: "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif", background: C.bgMain }}>

      <style>{`
        @keyframes wa-bounce {
          0%,80%,100% { transform: translateY(0);  opacity: 0.45; }
          40%          { transform: translateY(-5px); opacity: 1;    }
        }
        @keyframes cursor-blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        @keyframes bubble-pop-right {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); transform-origin: bottom right; }
          100% { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
        }
        @keyframes bubble-pop-left {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); transform-origin: bottom left; }
          100% { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom left; }
        }
        @keyframes tick-blue-anim {
          0%, 60% { stroke: #8696A0; }
          100%    { stroke: #53BDEB; }
        }
      `}</style>

      {/* ── Status bar iOS (Dynamic) ── */}
      <div className="flex-shrink-0 px-6 pt-3 flex items-center justify-between" style={{ background: '#000000', height: 44 }}>
        <div className="flex-1 flex items-center">
          <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, letterSpacing: -0.3, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif' }}>
            {messages.find(m => m.id === shown[shown.length - 1])?.time || messages[0]?.time || '19:44'}
          </span>
        </div>
        <div className="flex items-center gap-[6px]">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
            <rect x="0" y="7" width="3" height="4" rx="1" fill="white"/>
            <rect x="4" y="5" width="3" height="6" rx="1" fill="white"/>
            <rect x="8" y="2" width="3" height="9" rx="1" fill="white"/>
            <rect x="12" y="0" width="3" height="11" rx="1" fill="white" fillOpacity="0.3"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
            <path d="M8 6C5.8 6 3.8 6.9 2.3 8.4l1.4 1.4C4.9 8.7 6.3 8 8 8s3.1.7 4.3 1.8l1.4-1.4C12.2 6.9 10.2 6 8 6z"/>
            <path d="M8 2.5C4.7 2.5 1.7 3.9 0 6.2l1.5 1.3C2.9 5.4 5.3 4 8 4s5.1 1.4 6.5 3.5L16 6.2C14.3 3.9 11.3 2.5 8 2.5z"/>
          </svg>
          <div className="relative w-[22px] h-[11px] rounded-[2.5px] border border-white/30 px-[1.5px] py-[1.5px]">
            <div className="h-full bg-white rounded-[1px]" style={{ width: '85%' }} />
            <div className="absolute top-[3px] -right-[3px] w-[2px] h-[4.5px] bg-white/30 rounded-r-[1px]" />
          </div>
        </div>
      </div>

      {/* Ligne "← Snapchat" sous la barre de statut */}
      <div className="flex items-center gap-[4px] py-1" style={{ paddingLeft: 20, background: '#000000' }}>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M5 1.5 L1 5 L5 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif' }}>Snapchat</span>
      </div>

      {/* ── Header contact iOS ── */}
      <div className="flex items-center flex-shrink-0"
        style={{ background: C.bgHeader, padding: '10px 16px 12px 10px', gap: 8 }}>

        {/* Gauche : chevron blanc + badge vert */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 2 }}>
          <ion-icon name="chevron-back" style={{ fontSize: 30, color: C.text } as React.CSSProperties} />
          <span style={{ color: '#ffffff', fontSize: 17, fontWeight: 500, lineHeight: 1 }}>18</span>
        </div>

        {/* Avatar */}
        <Avatar name={contactName} url={contactAvatar} size={44} />

        {/* Nom — une seule ligne, pas de status */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 18, letterSpacing: -0.3, lineHeight: 1.2 }} className="truncate">
            {contactName}
          </div>
        </div>

        {/* Icônes droite : caméra vidéo + téléphone */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 22 }}>
          <ion-icon name="videocam-outline" style={{ fontSize: 27, color: C.text } as React.CSSProperties} />
          <ion-icon name="call-outline"     style={{ fontSize: 25, color: C.text } as React.CSSProperties} />
        </div>
      </div>

      {/* ── Zone messages ── */}
      <div className="flex-1 relative flex flex-col" style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
        
        {/* Fixe WhatsApp Background (no scrolling void) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url(${waBgUrl})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '420px auto',
          filter: 'grayscale(1) invert(1)',
          opacity: 0.12,
          zIndex: 0
        }} />

        {/* Scroll Container */}
        <div ref={scrollRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden px-2 py-3 flex flex-col gap-[3px] z-10">

        {/* Badge date Hier */}
        {messages.some(m => m.isYesterday) && (
          <div className="flex justify-center mb-3" style={{ position: 'relative', zIndex: 1 }}>
            <span className="text-[12px] px-3 py-[3px] rounded-full font-semibold"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#E9EDEF' }}>
              Hier
            </span>
          </div>
        )}

        {messages.filter(m => m.isYesterday && shown.includes(m.id)).map((msg) => renderMessage(msg))}

        {/* Badge date Aujourd'hui */}
        <div className="flex justify-center my-3" style={{ position: 'relative', zIndex: 1 }}>
          <span className="text-[12px] px-3 py-[3px] rounded-full font-semibold"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#E9EDEF' }}>
            Aujourd'hui
          </span>
        </div>

        {messages.filter(m => !m.isYesterday).map((msg) => renderMessage(msg))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {theyType && <TypingBubble />}
        </div>
        <div style={{ height: 6 }} />
      </div>
      </div>

      {/* ── Footer iOS ── */}
      <div className="flex items-center px-3 py-[10px] gap-[10px] flex-shrink-0" style={{ background: C.bgHeader }}>
        {/* + (grande icône blanche) */}
        <button className="flex-shrink-0 flex items-center justify-center">
          <ion-icon name="add" style={{ fontSize: 32, color: 'white' } as React.CSSProperties} />
        </button>

        {/* Champ pill + icônes intégrées */}
        <div className="flex-1 flex items-center gap-2 px-3 rounded-[22px]"
          style={{ background: C.inputBg, minHeight: 44 }}>
          {hasInput ? (
            <span style={{ color: C.text, fontSize: 14.5, flex: 1, lineHeight: 1.4 }}>
              {parseEmojis(inputText, 16)}
              <span style={{ display: 'inline-block', width: 2, height: 15, background: C.green, animation: 'cursor-blink 0.8s step-end infinite', borderRadius: 1, marginLeft: 1, verticalAlign: '-2px' }}/>
            </span>
          ) : (
            <span style={{ color: C.textSub, fontSize: 14.5, flex: 1 }} />
          )}
          {/* Icône sticker dans le champ */}
          {!hasInput && (
            <ion-icon name="happy-outline" style={{ fontSize: 22, color: C.textSub, flexShrink: 0 } as React.CSSProperties} />
          )}
        </div>

        {/* Caméra */}
        <button className="flex-shrink-0 flex items-center justify-center">
          {hasInput ? (
            <ion-icon name="send" style={{ fontSize: 24, color: C.green } as React.CSSProperties} />
          ) : (
            <ion-icon name="camera-outline" style={{ fontSize: 26, color: 'white' } as React.CSSProperties} />
          )}
        </button>

        {/* Micro */}
        {!hasInput && (
          <button className="flex-shrink-0 flex items-center justify-center">
            <ion-icon name="mic-outline" style={{ fontSize: 26, color: 'white' } as React.CSSProperties} />
          </button>
        )}
      </div>

      {/* ── Clavier iOS ancré en bas ── */}
      <IOSKeyboard inputText={inputText} />

    </div>
    </EmojiProvider>
  );
}
