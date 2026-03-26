import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, RotateCcw, Plus, Trash2, MessageCircle,
  Image, Youtube, Type, Upload, X, Video, Loader2, Download,
  Save, FolderHeart, History as HistoryIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import WhatsAppChat from '../components/WhatsAppChat';
import IMessageChat from '../components/IMessageChat';
import type { ChatMsg, MsgType } from '../components/WhatsAppChat';

// ── Helpers YouTube ──────────────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchYoutubeTitle(id: string): Promise<string> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
    const data = await res.json();
    return data.title ?? 'Vidéo YouTube';
  } catch {
    return 'Vidéo YouTube';
  }
}

// ── Default messages ─────────────────────────────────────────────────────────
const DEFAULT_MESSAGES: ChatMsg[] = [
  { id: '1', from: 'them', text: "T'as un tatouage ?! 😱",           time: '14:23', delay: 500,  read: false },
  { id: '2', from: 'me',   text: 'Oui pourquoi 😅',                   time: '14:24', delay: 1500, read: true  },
  { id: '3', from: 'them', text: "C'EST PERMANENT ?!?!",              time: '14:24', delay: 1200, read: false },
  { id: '4', from: 'me',   text: "Bah... c'est un tatouage maman",    time: '14:25', delay: 2000, read: true  },
  { id: '5', from: 'them', text: 'JE SUIS TELLEMENT DÉÇUE 😭😭',     time: '14:25', delay: 1500, read: false },
  { id: '6', from: 'me',   text: 'Mais t\'aimes pas ? 😢',            time: '14:26', delay: 1800, read: true  },
  { id: '7', from: 'them', text: "Si... c'est stylé en fait 😂❤️",   time: '14:26', delay: 2000, read: false },
];

let nextId = DEFAULT_MESSAGES.length + 1;
type AppStyle = 'whatsapp' | 'imessage';

// ── Composant principal ───────────────────────────────────────────────────────
export default function ChatBuilder() {
  const { user } = useAuth();
  const [appStyle,       setAppStyle]         = useState<AppStyle>('whatsapp');
  const [messages,       setMessages]         = useState<ChatMsg[]>(DEFAULT_MESSAGES);
  const [contactName,    setContactName]       = useState('Maman 👩‍👦');
  const [contactStatus,  setContactStatus]     = useState('en ligne');
  const [contactAvatar,  setContactAvatar]     = useState<string | undefined>(undefined);
  const [isPlaying,      setIsPlaying]         = useState(false);
  const [editIdx,        setEditIdx]           = useState<number | null>(null);

  // YouTube
  const [ytInput,    setYtInput]    = useState('');
  const [ytFetching, setYtFetching] = useState(false);
  const [ytPreview,  setYtPreview]  = useState<{ id: string; title: string } | null>(null);
  const [ytError,    setYtError]    = useState('');

  // Export
  const [isRecording,       setIsRecording]       = useState(false);
  const [exportStatus,      setExportStatus]       = useState<'idle'|'recording'|'done'|'error'>('idle');
  const [readyBlob,         setReadyBlob]          = useState<{ blob: Blob; filename: string } | null>(null);

  // Script Importer
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptInput,     setScriptInput]     = useState('');
  const [isImporting,     setIsImporting]     = useState(false);
  
  // Saved Scripts
  const [showSavedScripts, setShowSavedScripts] = useState(false);
  const [savedScripts,     setSavedScripts]     = useState<any[]>([]);
  const [isSaving,         setIsSaving]         = useState(false);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  
  // Ref pour synchroniser l'arrêt de l'enregistrement avec la fin réelle de l'animation
  const isPlayingRef = useRef(false);

  // Refs
  const previewRef   = useRef<HTMLDivElement>(null);

  const totalDuration = messages.reduce((acc, m) => acc + m.delay, 0) / 1000;

  // ── Play ───────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 50);
  }, []);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setContactAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Image for message ──────────────────────────────────────────────────────
  const handleImageForMsg = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateMsg(idx, { imageUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  // ── YouTube fetch ──────────────────────────────────────────────────────────
  const handleYtFetch = async (idx: number) => {
    const id = extractYoutubeId(ytInput.trim());
    if (!id) { setYtError('URL invalide'); return; }
    setYtFetching(true); setYtError('');
    const title = await fetchYoutubeTitle(id);
    setYtFetching(false);
    setYtPreview({ id, title });
    updateMsg(idx, { youtubeId: id, youtubeTitle: title });
  };

  useEffect(() => {
    if (editIdx === null) { setYtInput(''); setYtPreview(null); setYtError(''); return; }
    const msg = messages[editIdx];
    if (msg?.type === 'youtube' && msg.youtubeId) {
      setYtInput(`https://youtu.be/${msg.youtubeId}`);
      setYtPreview({ id: msg.youtubeId, title: msg.youtubeTitle ?? '' });
    } else { setYtInput(''); setYtPreview(null); setYtError(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editIdx]);

  // ── Messages CRUD ──────────────────────────────────────────────────────────
  const addMessage = (type: MsgType = 'text') => {
    const newMsg: ChatMsg = {
      id: String(nextId++), from: 'them',
      text: type === 'text' ? 'Nouveau message' : '',
      time: '14:30', delay: 1500, read: false, type,
    };
    setMessages(prev => [...prev, newMsg]);
    setEditIdx(messages.length);
  };

  const deleteMsg = (idx: number) => {
    setMessages(prev => prev.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  const updateMsg = (idx: number, patch: Partial<ChatMsg>) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };

  // ── Script Persistence ─────────────────────────────────────────────────────
  const loadSavedScripts = useCallback(async () => {
    if (!user) return;
    setIsLoadingScripts(true);
    try {
      const { data, error } = await supabase
        .from('tiktok_scripts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedScripts(data || []);
    } catch (err) {
      console.error('Error loading scripts:', err);
    } finally {
      setIsLoadingScripts(false);
    }
  }, [user]);

  const handleSaveScript = async () => {
    if (!user) {
      alert("Vous devez être connecté pour sauvegarder vos scripts.");
      return;
    }
    if (!scriptInput.trim()) {
      alert("Le script est vide.");
      return;
    }

    setIsSaving(true);
    try {
      const title = scriptInput.split('\n')[0].replace(/[#*🎬]/g, '').trim().substring(0, 50) || "Sans titre";
      const { error } = await supabase
        .from('tiktok_scripts')
        .insert([{ 
          user_id: user.id, 
          title, 
          content: scriptInput 
        }] as any);
      if (error) throw error;
      alert("Script sauvegardé !");
      loadSavedScripts();
    } catch (err) {
      console.error('Error saving script:', err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadScript = (content: string) => {
    setScriptInput(content);
    setShowSavedScripts(false);
    setShowScriptModal(true);
  };

  const handleDeleteScript = async (id: string) => {
    if (!window.confirm("Supprimer ce script ?")) return;
    try {
      await supabase.from('tiktok_scripts').delete().eq('id', id);
      setSavedScripts(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting script:', err);
    }
  };

  useEffect(() => {
    if (user) loadSavedScripts();
  }, [user, loadSavedScripts]);

  // ── Import Script ─────────────────────────────────────────────────────────
  const handleImportScript = async () => {
    if (!scriptInput.trim()) return;
    setIsImporting(true);

    const lines = scriptInput.split('\n');
    const parsedMsgs: ChatMsg[] = [];
    let currentSpeaker: 'me' | 'them' | null = null;
    let currentText = '';

    const pushMessage = () => {
      if (!currentText.trim()) return;
      
      const ytMatch = currentText.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s]+)/);
      let ytId = '';
      if (ytMatch) {
        ytId = extractYoutubeId(ytMatch[1]) || '';
        currentText = currentText.replace(ytMatch[1], '').trim();
      }

      const type = ytId ? 'youtube' : 'text';
      const delay = Math.max(1200, Math.min(4000, currentText.length * 30));

      // Use a random ID generator 
      const newId = String(Date.now() + Math.random().toString(36).substring(2, 9));

      parsedMsgs.push({
        id: newId,
        from: currentSpeaker || 'them',
        text: currentText.trim(),
        time: '14:00',
        delay,
        read: currentSpeaker === 'me',
        type,
        youtubeId: ytId || undefined,
        isYesterday: parsedMsgs.length === 0, // Le premier message est toujours "Hier"
      });
      currentText = '';
    };

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        if (currentText) pushMessage();
        continue;
      }
      
      if (line.match(/^(🎬|#|-{3})/)) {
        if (currentText) pushMessage();
        continue;
      }

      const lower = line.toLowerCase();
      if (lower.startsWith('you:') || lower.startsWith('kali:')) {
        pushMessage();
        currentSpeaker = 'me';
        currentText = line.substring(line.indexOf(':') + 1).trim();
      } else if (lower.startsWith('mom:')) {
        pushMessage();
        currentSpeaker = 'them';
        currentText = line.substring(4).trim();
      } else {
        if (currentText) currentText += '\n';
        currentText += line;
      }
    }
    pushMessage();

    let minutesOffset = 0;
    const finalMsgs = await Promise.all(parsedMsgs.map(async (m, i) => {
      if (i > 0 && i % 3 === 0) minutesOffset++;
      const mm = (10 + minutesOffset).toString().padStart(2, '0');
      m.time = m.isYesterday ? '22:14' : `14:${mm}`;
      
      if (m.type === 'youtube' && m.youtubeId) {
        m.youtubeTitle = await fetchYoutubeTitle(m.youtubeId);
      }
      return m;
    }));

    setMessages(finalMsgs);
    setEditIdx(null);
    setIsImporting(false);
    setShowScriptModal(false);
    setScriptInput('');
  };

  // ── Export MP4/WebM ────────────────────────────────────────────────────────
  const exportVideo = async () => {
    if (isRecording || !previewRef.current) return;

    let displayStream: MediaStream;
    try {
      // preferCurrentTab aide à sélectionner automatiquement cet onglet dans le popup Chrome
      // Demander la résolution IDEAL la plus haute (4K) pour forcer le navigateur à capturer avec le maximum de détails
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'browser',
          width: { ideal: 3840, max: 4096 },
          height: { ideal: 2160, max: 4096 },
          frameRate: { ideal: 60 }
        },
        audio: false,
        preferCurrentTab: true 
      } as any);
    } catch (e) {
      console.warn("L'utilisateur a annulé le partage d'écran :", e);
      return;
    }

    setIsRecording(true);
    setExportStatus('recording');

    const video = document.createElement('video');
    video.srcObject = displayStream;
    video.playsInline = true;
    video.muted = true;
    await video.play();

    // Attendre que la UI passe à l'échelle 1 (isRecording = true active la transition CSS)
    await new Promise(r => setTimeout(r, 400));

    const rect = previewRef.current.getBoundingClientRect();
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;

    // Arrondir les valeurs pour éviter le flou de sous-pixel anti-aliasing
    const cropX = Math.round(rect.left * scaleX);
    const cropY = Math.round(rect.top * scaleY);
    const cropW = Math.round(rect.width * scaleX);
    const cropH = Math.round(rect.height * scaleY);

    const canvas = document.createElement('canvas');
    
    // Le secret pour une vidéo nette (pas floue/dégueulasse) : 
    // NE PAS étirer artificiellement l'image à W*2.
    // Dessiner EXACTEMENT au pixel près le morceau qu'on a capturé !
    canvas.width = cropW; 
    canvas.height = cropH;
    
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.imageSmoothingEnabled = false; // Désactiver le lissage pour garder le piqué du texte

    const mimeType =
      MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2') ? 'video/mp4;codecs=avc1,mp4a.40.2' :
      MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' :
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
      'video/webm';
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';

    const canvasStream = canvas.captureStream(60);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(canvasStream, {
        mimeType: mimeType.includes(';codecs') ? mimeType.split(';')[0] : mimeType,
        videoBitsPerSecond: 8_000_000,
      });
    } catch {
      recorder = new MediaRecorder(canvasStream, { videoBitsPerSecond: 8_000_000 });
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    
    const stopRecording = () => {
      recorder.stop();
      displayStream.getTracks().forEach(t => t.stop());
    };

    recorder.onstop = () => {
      const finalMime = recorder.mimeType || 'video/webm';
      const actualExt = finalMime.includes('mp4') ? 'mp4' : 'webm';
      const filename = `chat-tiktok.${actualExt}`;
      const blob = new Blob(chunks, { type: finalMime });

      // Stocker le blob — le téléchargement sera déclenché par un clic utilisateur
      // (showSaveFilePicker nécessite un geste utilisateur récent)
      setReadyBlob({ blob, filename });
      setIsRecording(false);
      setExportStatus('done');
    };

    setIsPlaying(false);
    isPlayingRef.current = false;
    await new Promise(r => setTimeout(r, 100)); // micro pause reset
    
    recorder.start();
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsRecording(true);
    setExportStatus('recording');

    // On boucle tant que isPlayingRef.current est vrai. 
    // Il passera à false quand WhatsAppChat appellera onDone()
    const captureFrame = () => {
      if (recorder.state === 'inactive') return;
      
      // Si l'animation est finie, on arrête l'enregistrement
      if (!isPlayingRef.current) {
        stopRecording();
        return;
      }

      if (ctx && video.readyState >= 2) {
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
      }
      requestAnimationFrame(captureFrame);
    };

    captureFrame();
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a', fontFamily: "-apple-system,'Helvetica Neue',sans-serif" }}>

      {/* ════ Panneau gauche ════ */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-white/10 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-5 h-5 text-purple-400" />
            <h1 className="text-white font-bold text-lg">Chat Builder</h1>
          </div>
          <p className="text-white/40 text-xs">Crée des fausses conversations pour TikTok</p>
        </div>

        {/* Style selector */}
        <div className="px-5 py-4 border-b border-white/10">
          <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block">Style</label>
          <div className="grid grid-cols-2 gap-2">
            {(['whatsapp','imessage'] as AppStyle[]).map(s => (
              <button key={s} onClick={() => setAppStyle(s)}
                className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                  appStyle === s
                    ? s === 'whatsapp' ? 'bg-[#00a884] text-white' : 'bg-[#007AFF] text-white'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}>
                {s === 'whatsapp' ? '💬 WhatsApp' : '🍎 iMessage'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="px-5 py-4 border-b border-white/10 space-y-3">
          <label className="text-white/50 text-xs uppercase tracking-wider block">Contact</label>
          <div className="flex items-center gap-3">
            {/* Avatar upload */}
            <button
              onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange = e => handleAvatarChange(e as unknown as React.ChangeEvent<HTMLInputElement>); inp.click(); }}
              className="relative flex-shrink-0 group" title="Changer la photo">
              {contactAvatar ? (
                <img src={contactAvatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/20" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-0.5">
                  <Upload className="w-4 h-4 text-white/40" />
                  <span className="text-white/30 text-[9px]">Photo</span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-4 h-4 text-white" />
              </div>
            </button>

            <div className="flex-1 space-y-2">
              <div>
                <label className="text-white/40 text-[11px] mb-1 block">Nom</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/30"
                  value={contactName} onChange={e => setContactName(e.target.value)} />
              </div>
              {appStyle === 'whatsapp' && (
                <div>
                  <label className="text-white/40 text-[11px] mb-1 block">Statut</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/30"
                    value={contactStatus} onChange={e => setContactStatus(e.target.value)} />
                </div>
              )}
            </div>
          </div>
          {contactAvatar && (
            <button onClick={() => setContactAvatar(undefined)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
              <X className="w-3 h-3" /> Supprimer la photo
            </button>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="px-5 py-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <label className="text-white/50 text-xs uppercase tracking-wider">Messages ({messages.length})</label>
          </div>

          <div className="space-y-2">
            {messages.map((msg, idx) => {
              const msgType = msg.type ?? 'text';
              const typeIcon = msgType === 'image' ? '🖼️' : msgType === 'youtube' ? '▶️' : null;
              return (
                <div key={msg.id}
                  className={`rounded-xl border transition-all cursor-pointer ${editIdx === idx ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
                  onClick={() => setEditIdx(editIdx === idx ? null : idx)}>

                  <div className="px-3 py-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      msg.from === 'me'
                        ? appStyle === 'whatsapp' ? 'bg-[#005c4b] text-[#00a884]' : 'bg-[#007AFF]/20 text-[#007AFF]'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {msg.from === 'me' ? 'Moi' : contactName.split(' ')[0]}
                    </span>
                    {typeIcon && <span className="text-sm flex-shrink-0">{typeIcon}</span>}
                    <span className="text-white/70 text-sm flex-1 truncate">
                      {msgType === 'image'   ? (msg.imageUrl   ? 'Image jointe'           : '— aucune image')   :
                       msgType === 'youtube' ? (msg.youtubeId  ? (msg.youtubeTitle ?? `youtube.com`) : '— aucune vidéo') :
                       msg.text || '—'}
                    </span>
                    <span className="text-white/30 text-xs flex-shrink-0">+{(msg.delay/1000).toFixed(1)}s</span>
                  </div>

                  {editIdx === idx && (
                    <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3" onClick={e => e.stopPropagation()}>

                      {/* Type */}
                      <div>
                        <label className="text-white/40 text-xs block mb-1.5">Type</label>
                        <div className="flex gap-2">
                          {([
                            { t: 'text' as MsgType,    label: '💬 Texte',   cls: 'bg-purple-600' },
                            { t: 'image' as MsgType,   label: '🖼️ Image',   cls: 'bg-blue-600'   },
                            { t: 'youtube' as MsgType, label: '▶️ YouTube', cls: 'bg-red-600'    },
                          ]).map(({ t, label, cls }) => (
                            <button key={t} onClick={() => updateMsg(idx, { type: t })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${msgType === t ? `${cls} text-white` : 'bg-white/10 text-white/50 hover:bg-white/15'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expéditeur */}
                      <div>
                        <label className="text-white/40 text-xs block mb-1.5">Expéditeur</label>
                        <div className="flex gap-2">
                          {(['me','them'] as const).map(s => (
                            <button key={s} onClick={() => updateMsg(idx, { from: s })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${msg.from === s ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/50 hover:bg-white/15'}`}>
                              {s === 'me' ? '👤 Moi' : '👥 Eux'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Texte */}
                      <div>
                        <label className="text-white/40 text-xs block mb-1">
                          {msgType === 'text' ? 'Message' : 'Légende (optionnelle)'}
                        </label>
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/30 resize-none"
                          rows={msgType === 'text' ? 3 : 2}
                          value={msg.text}
                          onChange={e => updateMsg(idx, { text: e.target.value })}
                          placeholder={msgType === 'text' ? 'Tapez votre message...' : 'Légende optionnelle...'}
                        />
                      </div>

                      {/* Image upload */}
                      {msgType === 'image' && (
                        <div>
                          <label className="text-white/40 text-xs block mb-1.5">Image</label>
                          {msg.imageUrl ? (
                            <div className="relative rounded-lg overflow-hidden">
                              <img src={msg.imageUrl} alt="" className="w-full rounded-lg object-cover" style={{ maxHeight: 130 }} />
                              <button onClick={() => updateMsg(idx, { imageUrl: undefined })}
                                className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black/90">
                                <X className="w-3.5 h-3.5 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange = e => handleImageForMsg(idx, e as unknown as React.ChangeEvent<HTMLInputElement>); inp.click(); }}
                              className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-white/15 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                              <Upload className="w-6 h-6 text-white/30" />
                              <span className="text-white/40 text-xs">Cliquer pour charger une image</span>
                              <span className="text-white/20 text-[10px]">JPG · PNG · GIF · WebP</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* YouTube */}
                      {msgType === 'youtube' && (
                        <div>
                          <label className="text-white/40 text-xs block mb-1.5">Lien YouTube</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-red-500/50"
                              placeholder="https://youtu.be/..."
                              value={ytInput}
                              onChange={e => { setYtInput(e.target.value); setYtError(''); setYtPreview(null); updateMsg(idx, { youtubeId: undefined, youtubeTitle: undefined }); }}
                            />
                            <button onClick={() => handleYtFetch(idx)} disabled={ytFetching || !ytInput.trim()}
                              className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-lg text-white text-xs font-semibold flex-shrink-0 flex items-center gap-1">
                              {ytFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              {ytFetching ? '…' : 'Charger'}
                            </button>
                          </div>
                          {ytError && <p className="text-red-400 text-xs mt-1">{ytError}</p>}
                          {ytPreview && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                              <img src={`https://img.youtube.com/vi/${ytPreview.id}/mqdefault.jpg`} alt="" className="w-full" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
                              <div className="px-3 py-2 bg-white/5">
                                <p className="text-white text-xs font-medium truncate">{ytPreview.title}</p>
                                <p className="text-white/40 text-[10px] mt-0.5">youtube.com · {ytPreview.id}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Heure + Délai */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-white/40 text-xs block mb-1">Heure</label>
                          <input className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-white/30"
                            value={msg.time} placeholder="14:30" onChange={e => updateMsg(idx, { time: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs block mb-1">Délai (ms)</label>
                          <input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-white/30"
                            value={msg.delay} step={100} min={300} onChange={e => updateMsg(idx, { delay: Number(e.target.value) })} />
                        </div>
                      </div>

                      <button onClick={() => deleteMsg(idx)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Boutons ajout rapide */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { type: 'text'    as MsgType, icon: <Type    className="w-4 h-4 text-purple-400" />, label: 'Texte',   cls: 'hover:border-purple-500/30 hover:bg-purple-500/5' },
              { type: 'image'   as MsgType, icon: <Image   className="w-4 h-4 text-blue-400"   />, label: 'Image',   cls: 'hover:border-blue-500/30   hover:bg-blue-500/5'   },
              { type: 'youtube' as MsgType, icon: <Youtube className="w-4 h-4 text-red-400"    />, label: 'YouTube', cls: 'hover:border-red-500/30    hover:bg-red-500/5'    },
            ].map(({ type, icon, label, cls }) => (
              <button key={type} onClick={() => addMessage(type)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 transition-all ${cls}`}>
                {icon}
                <span className="text-white/50 text-[10px]">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 text-center text-white/30 text-xs py-2">- ou -</div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowScriptModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all group"
            >
              <Type className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>{messages.length > 0 ? 'Modifier le script' : 'Coller un script (Auto-générer)'}</span>
            </button>

            <button
              onClick={() => setShowSavedScripts(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0091FF]/10 border border-[#0091FF]/20 text-[#0091FF] font-medium hover:bg-[#0091FF]/20 transition-all group"
            >
              <HistoryIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Mes Scripts</span>
            </button>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          <div className="text-white/30 text-xs text-center mb-1">
            Durée estimée : ~{totalDuration.toFixed(1)}s
          </div>

          {/* Play */}
          <button onClick={handlePlay} disabled={isRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: appStyle === 'whatsapp' ? '#00a884' : '#007AFF' }}>
            <Play className="w-4 h-4 fill-white" /> Lancer l'animation
          </button>

          {/* Export */}
          <button onClick={exportVideo} disabled={isRecording}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all active:scale-95 disabled:opacity-60 ${
              exportStatus === 'done' ? 'bg-green-600' :
              isRecording ? 'bg-white/20' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
            }`}>
            {isRecording ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : exportStatus === 'done' ? (
              <><Download className="w-4 h-4" /> Téléchargement lancé ✓</>
            ) : (
              <><Video className="w-4 h-4" /> Exporter MP4 / WebM</>
            )}
          </button>

          {/* Indicateur recording à la place de la barre de progression */}
          {exportStatus === 'recording' && (
            <div className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl border border-red-500/30">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-red-400 font-medium text-sm">Enregistrement en cours...</span>
            </div>
          )}

          {/* Bouton Télécharger (visible après fin d'enregistrement) */}
          {readyBlob && (
            <button
              onClick={async () => {
                const { blob, filename } = readyBlob;
                const actualExt = filename.split('.').pop() || 'webm';
                const baseMime = actualExt === 'mp4' ? 'video/mp4' : 'video/webm';
                if ('showSaveFilePicker' in window) {
                  try {
                    const handle = await (window as any).showSaveFilePicker({
                      suggestedName: filename,
                      types: [{ description: 'Video', accept: { [baseMime]: [`.${actualExt}`] } }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                  } catch (e: any) {
                    if (e.name !== 'AbortError') console.error('Save failed:', e);
                  }
                } else {
                  const url = URL.createObjectURL(new File([blob], filename, { type: baseMime }));
                  const a = document.createElement('a');
                  a.href = url; a.download = filename;
                  document.body.appendChild(a); a.click();
                  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 5000);
                }
                setReadyBlob(null);
                setExportStatus('idle');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30 transition-all animate-pulse"
            >
              <Download className="w-5 h-5" /> Télécharger la vidéo
            </button>
          )}

          {/* Reset */}
          <button onClick={() => { setIsPlaying(false); setMessages(DEFAULT_MESSAGES); setContactName('Maman 👩‍👦'); setContactAvatar(undefined); setEditIdx(null); setExportStatus('idle'); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white/40 hover:text-white text-sm transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        </div>
      </div>

      {/* ════ Preview (scaled, visuel) ════ */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto" style={{ background: '#060606' }}>
        <div ref={previewRef}
          style={{ 
            transform: isRecording ? 'scale(1)' : 'scale(0.85)', 
            transformOrigin: 'center center', 
            borderRadius: isRecording ? 0 : 44, 
            overflow: 'hidden',
            boxShadow: isRecording ? 'none' : '0 0 0 10px #1a1a1a, 0 0 0 12px #333, 0 40px 80px rgba(0,0,0,0.9)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s, box-shadow 0.4s'
          }}>
          {appStyle === 'whatsapp' ? (
            <WhatsAppChat contactName={contactName} contactAvatar={contactAvatar} contactStatus={contactStatus}
              messages={messages} isPlaying={isPlaying} onDone={() => {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }} />
          ) : (
            <IMessageChat contactName={contactName} messages={messages}
              isPlaying={isPlaying} onDone={() => {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }} />
          )}
        </div>

        {/* Indicateur recording */}
        {isRecording && (
          <div className="absolute top-6 right-8 flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-red-500/50">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold">REC</span>
          </div>
        )}
      </div>

      {/* ── Modal Script Importer ── */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 flex justify-between items-center border-b border-white/10">
              <div>
                <h3 className="text-white font-bold text-lg">Importer un script</h3>
                <p className="text-white/40 text-xs">Collez le texte généré par l'IA (Tiktok Script Generator)</p>
              </div>
              <button onClick={() => setShowScriptModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <textarea
                className="w-full h-80 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white/90 text-sm outline-none focus:border-purple-500/50 resize-none font-mono"
                placeholder="You:\nHey mom ❤️\n\nMom:\nYes my son\n..."
                value={scriptInput}
                onChange={e => setScriptInput(e.target.value)}
              />
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
              <button onClick={() => setShowScriptModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-white/50 hover:text-white transition-colors text-sm">
                Annuler
              </button>
              
              <button 
                onClick={handleSaveScript} 
                disabled={isSaving || !scriptInput.trim()}
                className="px-6 py-2.5 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-white flex items-center gap-2 transition-all text-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Sauvegarder</span>
              </button>

              <button 
                onClick={handleImportScript} 
                disabled={isImporting || !scriptInput.trim()}
                className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white flex items-center gap-2 transition-all text-sm shadow-lg shadow-purple-600/20">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isImporting ? 'Génération...' : 'Importer et générer le Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Mes Scripts */}
      {showSavedScripts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-white/10 rounded-[32px] w-full max-w-2xl p-8 relative shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setShowSavedScripts(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0091FF]/20 flex items-center justify-center">
                <FolderHeart className="w-6 h-6 text-[#0091FF]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Mes Scripts Sauvegardés</h2>
                <p className="text-neutral-500">Retrouvez vos créations ici ou sur mobile</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingScripts ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-neutral-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0091FF]" />
                  <p>Chargement de vos scripts...</p>
                </div>
              ) : savedScripts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-neutral-500">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Aucun script sauvegardé pour le moment.</p>
                </div>
              ) : (
                savedScripts.map((script) => (
                  <div 
                    key={script.id}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 hover:border-[#0091FF]/30 transition-all group"
                  >
                    <div className="flex-1 cursor-pointer text-left" onClick={() => handleLoadScript(script.content)}>
                      <h3 className="font-bold text-white group-hover:text-[#0091FF] transition-colors">{script.title}</h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(script.created_at).toLocaleDateString()} • {script.content.length} chars
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteScript(script.id)}
                      className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
