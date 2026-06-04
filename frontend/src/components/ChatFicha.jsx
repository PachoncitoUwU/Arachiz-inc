import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { Send, User as UserIcon } from 'lucide-react';
import fetchApi from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function ChatFicha({ fichaId }) {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Cargar historial
    fetchApi(`/chat/ficha/${fichaId}`)
      .then(res => {
        setMessages(res.mensajes || []);
      })
      .catch(err => {
        console.error('Error fetching chat history:', err);
        showToast('Error cargando el historial del chat', 'error');
      })
      .finally(() => setLoading(false));

    // Conectar socket
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.emit('joinChat', fichaId);

    socket.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit('leaveChat', fichaId);
      socket.disconnect();
    };
  }, [fichaId]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socketRef.current.emit('sendMessage', {
      fichaId,
      senderId: user.id,
      texto: inputText.trim()
    });

    setInputText('');
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-zinc-800 px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          Chat de la Ficha
        </h3>
        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          En línea
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-zinc-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">No hay mensajes aún.</p>
            <p className="text-xs mt-1">¡Sé el primero en saludar!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user.id;
            const isInstructor = msg.sender.userType === 'instructor' || msg.sender.userType === 'admin';
            
            return (
              <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className={`flex max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.sender.avatarUrl ? (
                      <img src={msg.sender.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isInstructor ? 'bg-blue-500' : 'bg-green-500'}`}>
                        {msg.sender.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-500 mb-1 px-1 flex items-center gap-1">
                      {isInstructor && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded text-[9px] font-bold uppercase">Instructor</span>}
                      {msg.sender.fullName}
                    </span>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isMe 
                        ? 'bg-blue-500 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.texto}</p>
                      <p className={`text-[9px] text-right mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 dark:bg-zinc-900 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-800 rounded-full px-4 py-2 text-sm text-gray-800 dark:text-gray-200 transition-all outline-none"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white flex items-center justify-center transition-all disabled:cursor-not-allowed transform active:scale-95"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
