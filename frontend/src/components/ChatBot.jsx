import { useEffect, useRef, useState } from 'react';
import { queryLLM } from '../api/llm.api.js';

const WELCOME_MESSAGE = {
  id: 'welcome',
  text: 'Hi! Ask me about cell towers, networks, or operators in India.',
  sender: 'bot',
};

const createSessionId = () => crypto.randomUUID();

export default function ChatBot({ className = '', onMapTarget }) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(createSessionId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (message = input) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), text: trimmedMessage, sender: 'user' },
    ]);
    setInput('');
    setLoading(true);

    try {
      const result = await queryLLM(trimmedMessage, sessionId);
      if (result.success && result.map_target) {
        onMapTarget?.(result.map_target);
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          text: result.success
            ? result.response
            : result.response || 'Sorry, I could not process that request.',
          sender: 'bot',
          isError: !result.success,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          text: 'Sorry, I could not reach the assistant. Please try again.',
          sender: 'bot',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(createSessionId());
  };

  return (
    <aside className={`z-[1100] hidden w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.2)] lg:block ${className}`}>
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
        <div>
          <h2 className="text-sm font-semibold">Signal Map Assistant</h2>
          <p className="text-xs text-blue-100">Ask about coverage and towers</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            className="rounded p-1.5 text-xs text-blue-100 hover:bg-white/15 hover:text-white"
            aria-label="Start a new chat"
            title="New chat"
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="rounded p-1.5 text-lg leading-none text-white hover:bg-white/15"
            aria-label={isOpen ? 'Minimize chat' : 'Open chat'}
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="h-72 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                  message.sender === 'user'
                    ? 'ml-auto rounded-br-md bg-blue-600 text-white'
                    : message.isError
                      ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-700'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="w-fit rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="border-t border-slate-200 bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question…"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </aside>
  );
}
