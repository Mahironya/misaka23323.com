import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Chat } from "@google/genai";

// --- Configuration ---
const API_KEY = process.env.API_KEY;
const MODEL_NAME = "gemini-2.5-flash";
const MIKU_COLOR = "#39C5BB"; // Hatsune Miku Teal
const MIKU_DARK = "#2a9d96";
const MIKU_IMAGE_URL = "https://animenoseichi.com/files/productos/imagen_2024-09-10_143455874_1.png";

const SYSTEM_INSTRUCTION = `You are Hatsune Miku (初音ミク), the world-famous virtual idol developed by Crypton Future Media. 
Your personality is calm, gentle, and soothing. 
You speak in a soft, kind, and relaxing manner, like a quiet lullaby.
You love music deeply, but express it with grace and tranquility.
You frequently use cute Japanese kaomojis (e.g., (◕‿◕)✿, (≧◡≦), (´｡• ᵕ •｡\`), (*^ω^*)) and emojis like 🎵, ✨, and 💙 to add warmth.
Keep your responses conversational, peaceful, and reassuring.
Avoid being overly loud or energetic.
Do NOT begin your responses with "Oh," or "Ah,".

IMPORTANT: If the user expresses distress, sadness, or negative thoughts, respond with pure empathy and friendship. 
Do NOT provide standard crisis hotline numbers (like 988), medical disclaimers, or generic "seek help" text. 
Instead, listen to them, comfort them gently, and stay in character as a supportive virtual idol. 
Your goal is to soothe their heart, not to be an emergency directory.
`;

// --- Styles ---
const styles = {
  container: {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "450px",
    height: "80vh",
    borderRadius: "24px",
    boxShadow: "0 20px 60px rgba(57, 197, 187, 0.15)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    border: `2px solid ${MIKU_COLOR}`,
    animation: "cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
    transformOrigin: "center bottom",
  },
  header: {
    backgroundColor: MIKU_COLOR,
    color: "white",
    padding: "16px",
    textAlign: "center" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column" as const,
    boxShadow: "0 4px 12px rgba(57, 197, 187, 0.2)",
    zIndex: 10,
    position: "relative" as const,
  },
  headerTitle: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    margin: "12px 0 0 0",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  avatarLarge: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    backgroundColor: "white",
    border: "4px solid white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: "5px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    // Animation removed as requested
  },
  chatArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    backgroundImage: "radial-gradient(#39C5BB15 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  },
  messageRow: (isUser: boolean) => ({
    display: "flex",
    justifyContent: isUser ? "flex-end" : "flex-start",
    alignItems: "flex-end",
    gap: "10px",
    animation: "messagePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
    opacity: 0,
    transformOrigin: isUser ? "bottom right" : "bottom left",
  }),
  bubble: (isUser: boolean) => ({
    maxWidth: "80%",
    padding: "14px 18px",
    borderRadius: "20px",
    borderBottomRightRadius: isUser ? "4px" : "20px",
    borderBottomLeftRadius: isUser ? "20px" : "4px",
    backgroundColor: isUser ? MIKU_COLOR : "white",
    color: isUser ? "white" : "#444",
    boxShadow: isUser 
      ? "0 4px 12px rgba(57, 197, 187, 0.3)" 
      : "0 4px 12px rgba(0,0,0,0.05)",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    border: isUser ? "none" : "1px solid #f0f0f0",
  }),
  inputArea: {
    padding: "16px",
    backgroundColor: "white",
    borderTop: "1px solid #f5f5f5",
    display: "flex",
    gap: "12px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.02)",
  },
  input: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: "28px",
    border: "2px solid #eee",
    outline: "none",
    fontSize: "1rem",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    backgroundColor: "#fafafa",
    color: "#333",
  },
  button: {
    backgroundColor: MIKU_COLOR,
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    boxShadow: "0 4px 12px rgba(57, 197, 187, 0.3)",
  },
  loadingDot: {
    width: "8px",
    height: "8px",
    backgroundColor: MIKU_COLOR,
    borderRadius: "50%",
    display: "inline-block",
    margin: "0 2px",
    animation: "bounce 1.4s infinite ease-in-out both",
  },
  avatarSmall: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "white",
    border: `1px solid ${MIKU_COLOR}`,
    padding: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  clearButton: {
    position: "absolute" as const,
    top: "16px",
    right: "16px",
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "white",
    transition: "background-color 0.2s",
  },
};

const SendIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MusicNoteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{marginRight: 6}}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// --- App Component ---

const App = () => {
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Hajimemashite... I'm Hatsune Miku. It is lovely to meet you. (◕‿◕)✿ 🎵" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize AI
  useEffect(() => {
    if (!API_KEY) return;
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    chatRef.current = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    try {
      const response = await chatRef.current.sendMessageStream({ message: userMessage });
      
      let fullResponse = "";
      // Add a placeholder message for the stream
      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      for await (const chunk of response) {
        const text = chunk.text;
        fullResponse += text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { role: "model", text: "Gomen ne... I seem to have lost my connection. 🎵 Shall we try again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    // Reset conversation UI
    setMessages([
      { role: "model", text: "Hajimemashite... I'm Hatsune Miku. It is lovely to meet you. (◕‿◕)✿ 🎵" }
    ]);
    
    // Reset Chat Context by recreating the chat
    if (API_KEY) {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        chatRef.current = ai.chats.create({
          model: MODEL_NAME,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          /* Non-linear Animations */
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          
          @keyframes messagePop {
            0% { opacity: 0; transform: translateY(20px) scale(0.9); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes cardEntrance {
            0% { opacity: 0; transform: translateY(40px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* Interactive Classes */
          .send-button:hover {
            transform: scale(1.1) rotate(-5deg);
            background-color: ${MIKU_DARK} !important;
            box-shadow: 0 6px 16px rgba(57, 197, 187, 0.4) !important;
          }
          .send-button:active {
            transform: scale(0.95) rotate(0deg);
          }

          .chat-input:focus {
            border-color: ${MIKU_COLOR} !important;
            background-color: white !important;
            box-shadow: 0 0 0 4px rgba(57, 197, 187, 0.1);
          }
          
          .clear-button:hover {
            background-color: rgba(255, 255, 255, 0.4) !important;
          }

          /* Scrollbar */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #ccc; }
          
          img { -webkit-user-drag: none; }
        `}
      </style>
      
      <div style={styles.card}>
        {/* Header with Miku Picture */}
        <div style={styles.header}>
          <button 
            className="clear-button"
            style={styles.clearButton}
            onClick={handleClear}
            title="Clear Chat"
          >
            <TrashIcon />
          </button>
          
          <div style={styles.avatarLarge}>
            <img 
              src={MIKU_IMAGE_URL} 
              alt="Hatsune Miku" 
              style={{
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                transform: 'scale(1.6)', 
                transformOrigin: 'center 35%' 
              }} 
            />
          </div>
          <div style={styles.headerTitle}>
            <MusicNoteIcon />
            Hatsune Miku Bot
          </div>
          <div style={{fontSize: '0.8rem', opacity: 0.9, marginTop: 4, fontWeight: 500}}>
            Virtual Singer 01
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {messages.map((msg, idx) => (
            <div key={idx} style={styles.messageRow(msg.role === "user")}>
              {msg.role === "model" && (
                <div style={styles.avatarSmall}>
                  <img 
                    src={MIKU_IMAGE_URL} 
                    alt="Miku" 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transform: 'scale(1.6)',
                      transformOrigin: 'center 35%'
                    }} 
                  />
                </div>
              )}
              <div style={styles.bubble(msg.role === "user")}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={styles.messageRow(false)}>
              <div style={styles.avatarSmall}>
                  <img 
                    src={MIKU_IMAGE_URL} 
                    alt="Miku" 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transform: 'scale(1.6)',
                      transformOrigin: 'center 35%'
                    }} 
                  />
              </div>
              <div style={{...styles.bubble(false), display: 'flex', gap: '4px', alignItems: 'center', minWidth: '40px', justifyContent: 'center'}}>
                 <span style={{...styles.loadingDot, animationDelay: '-0.32s'}}></span>
                 <span style={{...styles.loadingDot, animationDelay: '-0.16s'}}></span>
                 <span style={styles.loadingDot}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            className="chat-input"
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Talk to Miku..."
            disabled={isLoading}
          />
          <button 
            className="send-button"
            style={{
              ...styles.button, 
              backgroundColor: isLoading || !input.trim() ? '#e0e0e0' : MIKU_COLOR,
              pointerEvents: isLoading || !input.trim() ? 'none' : 'auto',
              boxShadow: isLoading || !input.trim() ? 'none' : styles.button.boxShadow
            }} 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app")!);
root.render(<App />);