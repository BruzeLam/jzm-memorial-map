import { useCallback, useState } from 'react';

export function useAgentChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    const message = text.trim();
    if (!message || loading) return null;

    const userMsg = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || data.error || '请求失败';
        throw new Error(msg);
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.reply || '',
        mapHits: data.mapHits || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return assistantMsg;
    } catch (err) {
      setError(err.message || '网络错误');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat, setError };
}
