import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  MapPin, 
  Laptop, 
  Ticket, 
  RefreshCw, 
  Bot, 
  User, 
  Sparkles, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  Info,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: "wajib" | "opsional";
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Saya adalah AI FAQ Assistant resmi untuk **Build With AI Solo**. 🚀\n\nSaya siap membantu menjawab seluruh pertanyaan Anda mengenai event seru yang akan diselenggarakan oleh Google Developer Groups (GDG) Solo ini.\n\nSilakan pilih salah satu pertanyaan populer di bawah atau ketik pertanyaan Anda sendiri!",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Mobile UI toggle for info sidebar
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  
  // Checklist for participants
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "pack-1", text: "Laptop pribadi", checked: false, category: "wajib" },
    { id: "pack-2", text: "Charger laptop", checked: false, category: "wajib" },
    { id: "pack-3", text: "Koneksi Wifi/Tethering cadangan", checked: false, category: "opsional" },
    { id: "pack-4", text: "E-Ticket RSVP / Bukti pendaftaran", checked: false, category: "wajib" },
    { id: "pack-5", text: "Botol minum (Tumbler) ramah lingkungan", checked: false, category: "opsional" },
    { id: "pack-6", text: "Semangat belajar & kolaborasi!", checked: false, category: "wajib" }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load checklist progress from localstorage
  useEffect(() => {
    const saved = localStorage.getItem("bwai_solo_checklist");
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse checklist state:", e);
      }
    }
  }, []);

  // Sync checklist progress back to localstorage
  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    localStorage.setItem("bwai_solo_checklist", JSON.stringify(updated));
  };

  // Auto-scroll chat window when new message arrives using length change
  const msgLength = messages.length;
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [msgLength, isLoading]);

  // Handle message submission
  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorText(null);
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mendapatkan respon dari server.");
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Terdapat masalah koneksi. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputVal);
  };

  const handleResetChat = () => {
    if (window.confirm("Apakah Anda ingin mereset riwayat chat?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Halo! Saya adalah AI FAQ Assistant resmi untuk **Build With AI Solo**. 🚀\n\nSaya siap membantu menjawab seluruh pertanyaan Anda mengenai event seru yang akan diselenggarakan oleh Google Developer Groups (GDG) Solo ini.\n\nSilakan pilih salah satu pertanyaan populer di bawah atau ketik pertanyaan Anda sendiri!",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setErrorText(null);
    }
  };

  const suggestedQuestions = [
    { label: "Kapan acara diadakan? 📅", query: "Kapan acara?" },
    { label: "Dimana lokasi acaranya? 📍", query: "Dimana lokasi acara?" },
    { label: "Apakah perlu bawa laptop? 💻", query: "Apakah perlu laptop?" },
    { label: "Apakah acaranya gratis? 🎟️", query: "Apakah acara gratis?" }
  ];

  // Progress of packed items
  const completedCount = checklist.filter(i => i.checked).length;
  const totalCount = checklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* HEADER SECTION with Google Colors Tech Bar */}
      <div className="w-full h-[3px] flex flex-row shrink-0">
        <div className="flex-1 bg-[#4285F4]"></div>
        <div className="flex-1 bg-[#EA4335]"></div>
        <div className="flex-1 bg-[#FBBC05]"></div>
        <div className="flex-1 bg-[#34A853]"></div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 relative overflow-hidden shrink-0">
            <Bot className="w-5.5 h-5.5 relative z-10" />
            <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-seven-bold text-slate-900 tracking-tight text-base sm:text-lg font-bold">
                Build With AI Solo
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
                Asisten AI
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Aktif • GDG Solo Info
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile info button */}
          <button 
            onClick={() => setIsSidebarOpenMobile(true)}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Info Event"
            id="mobile-info-toggle"
          >
            <Info className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleResetChat}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Reset Chat"
            id="reset-chat-btn"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row relative">
        
        {/* CHAT AREA */}
        <main className="flex-1 flex flex-col bg-white border-r border-slate-200 h-[calc(100vh-69px)]">
          
          {/* MESSAGES LIST CONTAINER */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-4 bg-slate-50/30"
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isAI = m.role === "assistant";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-4 max-w-2xl ${
                      isAI ? "self-start" : "self-end flex-row-reverse ml-auto"
                    }`}
                  >
                    {/* Messaging Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs border ${
                      isAI 
                        ? "bg-indigo-100 border-indigo-200 text-indigo-600" 
                        : "bg-slate-200 border-slate-300 text-slate-500"
                    }`}>
                      {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                    </div>

                    {/* Chat Bubble Wrapper */}
                    <div className="flex flex-col space-y-1">
                      <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                        isAI 
                          ? "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-xs" 
                          : "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100"
                      }`}>
                        {/* Format text line-breaks and bold matches */}
                        {m.content.split("\n\n").map((para, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {para.split("\n").map((line, j) => {
                              // basic parser for bold tags: **text**
                              const parts = line.split(/\*\*(.*?)\*\*/g);
                              return (
                                <span key={j} className="block">
                                  {parts.map((pPart, pIdx) => {
                                    if (pIdx % 2 === 1) {
                                      return (
                                        <strong 
                                          key={pIdx} 
                                          className={`font-bold ${isAI ? 'text-indigo-600' : 'text-white underline decoration-white/20'}`}
                                        >
                                          {pPart}
                                        </strong>
                                      );
                                    }
                                    return pPart;
                                  })}
                                </span>
                              );
                            })}
                          </p>
                        ))}
                      </div>
                      <span className={`text-[10px] text-slate-400 px-1 ${
                        !isAI ? "text-right" : "text-left"
                      }`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* AI Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 max-w-2xl"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none px-4 py-4 shadow-xs">
                  <div className="flex items-center gap-1.5 h-5 w-8 justify-center">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {errorText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 flex items-start gap-3 text-sm max-w-lg mx-auto"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Gagal Mengirim Pesan</h4>
                  <p className="text-xs text-red-600 mt-0.5">{errorText}</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* PRESets / QUICK QUESTIONS BUTTONS */}
          <div className="py-3 px-6 bg-slate-50/50 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Akses Cepat FAQ:</p>
            <div className="flex flex-wrap gap-1.5 max-w-full overflow-x-auto scrollbar-none pb-1">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q.query)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                  id={`faq-suggested-${idx}`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGE FORM INPUT */}
          <form 
            onSubmit={handleFormSubmit}
            className="p-4 md:p-6 border-t border-slate-200 bg-white"
          >
            <div className="w-full bg-white border border-slate-200 rounded-2xl flex items-center p-2 shadow-xs focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Tanyakan seputar acara Build With AI Solo..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm text-slate-700 outline-hidden placeholder:text-slate-300 bg-transparent border-none focus:ring-0 focus:outline-hidden"
                id="chat-input-field"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100/30 disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0"
                id="chat-submit-btn"
                title="Kirim Pesan"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
              Didukung oleh model asisten cerdas Gemini 3.5 Flash • GDG Solo FAQ
            </p>
          </form>

        </main>

        {/* SIDEBAR ON DESKTOP - Responsive detail sheet */}
        <aside className="hidden md:flex w-90 flex-col bg-slate-50 h-[calc(100vh-69px)] overflow-y-auto p-6 space-y-6 shrink-0 border-r border-slate-200">
          
          {/* EVENT CARD SUMMARY */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
              <h3 className="font-display font-bold text-sm">Informasi Utama Event</h3>
            </div>
            
            <div className="space-y-4">
              {/* Date */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs text-slate-400">Tanggal Acara</h4>
                  <p className="text-sm font-semibold text-slate-800">Sabtu, 13 Juni 2026</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs text-slate-400">Lokasi Acara</h4>
                  <p className="text-sm font-semibold text-slate-800">Hetero Space Solo</p>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">Purwodiningratan, Kec. Jebres, Surakarta</p>
                  <a 
                    href="https://maps.google.com/?q=Hetero+Space+Solo" 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    Buka Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Requirements */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs text-slate-400">Kebutuhan Acara</h4>
                  <p className="text-sm font-semibold text-slate-800">Wajib Membawa Laptop</p>
                  <p className="text-xs text-slate-500 leading-tight">Laptop cadangan daya baterai silakan diisi</p>
                </div>
              </div>

              {/* Free Ticket */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs text-slate-400">Tiket Pendaftaran</h4>
                  <p className="text-sm font-semibold text-slate-800">100% Gratis</p>
                  <p className="text-xs text-slate-500 leading-tight">Melalui registrasi/RSVP komunitas GDG</p>
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLIST PACKER GUEST STUFF */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ClipboardList className="w-5 h-5 text-slate-600" />
                <h3 className="font-display font-bold text-sm">Packer List Kamu</h3>
              </div>
              <span className="text-xs font-bold bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600">
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
                <span>Persiapan Kehadiran</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5 mt-1">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="w-full text-left flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                  id={`checklist-item-${item.id}`}
                >
                  <div className="shrink-0 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                    {item.checked ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Square className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-tight ${item.checked ? "line-through text-slate-400 font-normal" : "text-slate-700"}`}>
                      {item.text}
                    </p>
                    <span className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0.5 ${
                      item.category === 'wajib' 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* OFFICIAL GDG SOLO BANNER */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative overflow-hidden shadow-md shadow-indigo-100/50">
            <div className="absolute right-0 bottom-0 opacity-10 blur-0">
              <Bot className="w-32 h-32 scale-125 transform translate-x-4 translate-y-6" />
            </div>
            <div className="relative z-10 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-indigo-200">GDG Solo Community</h4>
              <p className="text-xs leading-relaxed text-indigo-50/90 font-medium">
                Berjejaring, kolaborasi, dan eksplorasi artificial intelligence bersama ratusan developer lokal se-Solo Raya.
              </p>
              <div className="pt-1">
                <a 
                  href="https://gdg.community.dev/gdg-community-groups-solo/" 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-1 bg-white text-indigo-600 text-[11px] font-bold px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Kunjungi Halaman <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </aside>

        {/* MOBILE SIDEBAR PANEL OVERLAY (DRAWER SHEET) */}
        <AnimatePresence>
          {isSidebarOpenMobile && (
            <>
              {/* Back backdrop constraint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpenMobile(false)}
                className="md:hidden fixed inset-0 bg-black z-50"
              />
              
              {/* Drawer layout inside viewport */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl z-50 p-6 overflow-y-auto space-y-6 flex flex-col shadow-xl"
              >
                
                {/* Drag / Pull bar spacer */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto shrink-0 mb-2"></div>
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                    <h3 className="font-display font-bold text-base text-slate-900">Detail Info Event</h3>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpenMobile(false)}
                    className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full h-7 w-7 flex items-center justify-center cursor-pointer hover:bg-slate-200"
                    id="mobile-close-sidebar-btn"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Date mobile */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-[10px] text-slate-400">Tanggal Acara</h4>
                      <p className="text-xs font-bold text-slate-800">13 Juni 2026</p>
                    </div>
                  </div>

                  {/* Location mobile */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-left">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <div className="w-full">
                      <h4 className="text-[10px] text-slate-400">Lokasi Acara</h4>
                      <p className="text-xs font-bold text-slate-800 truncate">Hetero Space Solo</p>
                    </div>
                  </div>

                  {/* Pack Requirement mobile */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                    <Laptop className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-[10px] text-slate-400">Kebutuhan Utama</h4>
                      <p className="text-xs font-bold text-slate-800">Membawa Laptop</p>
                    </div>
                  </div>

                  {/* Price mobile */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                    <Ticket className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-[10px] text-slate-400">Biaya Reservasi</h4>
                      <p className="text-xs font-bold text-slate-800">Gratis (RSVP)</p>
                    </div>
                  </div>
                </div>

                {/* Checklist segment on mobile */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <ClipboardList className="w-4.5 h-4.5 text-slate-500" />
                      <h4 className="text-sm font-bold">List Persediaan & Pack</h4>
                    </div>
                    <span className="text-xs font-bold bg-slate-200 px-2 py-0.5 rounded-sm">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {checklist.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleChecklist(item.id)}
                        className="w-full text-left flex items-start gap-2.5 py-1.5 px-2 rounded-lg bg-white border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                        id={`checklist-mobile-${item.id}`}
                      >
                        <div className="shrink-0 mt-0.5 text-slate-400">
                          {item.checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </div>
                        <p className={`text-xs font-medium ${item.checked ? "line-through text-slate-400 border-none" : "text-slate-700"}`}>
                          {item.text}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation helpers and external references */}
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href="https://maps.google.com/?q=Hetero+Space+Solo"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Buka Rute Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://gdg.community.dev/gdg-community-groups-solo/"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold text-center text-white flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-100"
                  >
                    Kunjungi Laman GDG Solo <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
