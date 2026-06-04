'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
export default function AIWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, sendMessage, status } = useChat();
    const bottomRef = useRef<HTMLDivElement>(null);
    const isLoading = status === 'submitted' || status === 'streaming';
    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {open && (
                <div className="w-80 sm:w-96 h-125 flex flex-col rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-purple-600 to-blue-600">
                        <div className="flex items-center gap-2">
                            <Bot size={18} className="text-white" />
                            <span className="text-white font-semibold text-sm">MYGAMELIST assistant</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
                                <Bot size={32} />
                                <p className="text-sm">Ask me anything about gaming!</p>
                            </div>
                        )}
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                        message.role === 'user'
                                            ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                                            : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                                    }`}
                                >
                                    {message.parts.map((part, i) => {
                                        if (part.type === 'text') {
                                            return (
                                                <div key={`${message.id}-${i}`} className="markdown-content">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({node, ...props}) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                                                            ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                                                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                                            h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                                                            strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
                                                        }}
                                                    >
                                                        {part.text}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="max-w-[80%] rounded-xl px-4 py-3.5 bg-gray-800 text-gray-200 rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                                    <div
                                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                        style={{ animationDelay: '0ms' }}
                                    ></div>
                                    <div
                                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                        style={{ animationDelay: '150ms' }}
                                    ></div>
                                    <div
                                        className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                                        style={{ animationDelay: '300ms' }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            if (!input.trim()) return;
                            sendMessage({ text: input });
                            setInput('');
                        }}
                        className="flex items-center gap-2 p-3 border-t border-gray-800"
                    >
                        <input
                            className="flex-1 bg-gray-800 text-gray-200 placeholder-gray-500 text-sm rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                            value={input}
                            placeholder="Ask something..."
                            onChange={e => setInput(e.currentTarget.value)}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-40 transition"
                        >
                            <Send size={15} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-xl hover:scale-105 transition-transform"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
}
