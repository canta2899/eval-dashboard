import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types.ts';

interface ChatProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  sendMessage: () => void;
  loading: boolean;
  chatId: string;
}

const Chat: React.FC<ChatProps> = ({ messages, input, setInput, sendMessage, loading, chatId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px', backgroundColor: '#f8fafc' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Ready for Interaction</h3>
            <p style={{ margin: 0 }}>Start a conversation to see real-time tracing data.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '24px', textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <div style={{
              display: 'inline-block', padding: '14px 20px', borderRadius: '20px',
              backgroundColor: m.role === 'user' ? '#3182ce' : '#fff',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
              maxWidth: '80%', textAlign: 'left', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              borderBottomRightRadius: m.role === 'user' ? '4px' : '20px',
              borderBottomLeftRadius: m.role === 'user' ? '20px' : '4px',
            }}>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                {m.role === 'user' ? (
                  String(m.content || "")
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown>
                      {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && <div style={{ color: '#64748b', fontSize: '13px', marginLeft: '4px' }}>Agent is generating a response...</div>}
      </div>

      <div style={{ padding: '24px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your query..."
          style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', background: '#f8fafc' }}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          style={{ padding: '0 32px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '16px', transition: 'transform 0.1s active' }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
