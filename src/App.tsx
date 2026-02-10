import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Shared Types ---
interface Message {
  role: string;
  content: string;
}

interface TraceStep {
  type: "model" | "tool";
  name: string;
  chatId: string;
  input: any;
  output?: any;
  error?: string;
  latency: number;
}

// --- Chat Component ---
interface ChatProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  sendMessage: () => void;
  loading: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, input, setInput, sendMessage, loading }) => {
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

// --- TraceVisualizer Component ---
interface TraceVisualizerProps {
  traces: TraceStep[];
}

const TraceVisualizer: React.FC<TraceVisualizerProps> = ({ traces }) => {
  const isHumanMessage = (m: any) => {
    if (!m) return false;
    if (m.id && Array.isArray(m.id)) {
      const classType = m.id[m.id.length - 1];
      if (classType === 'HumanMessage') return true;
    }
    const type = m.type;
    const role = m.role;
    return type === 'human' || type === 'HumanMessage' || role === 'user' || role === 'human';
  };

  const getMessageContent = (m: any) => {
    return m?.kwargs?.content || m?.content || "";
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f8fafc' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
        {traces.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>No execution data recorded yet.</div>}
        {traces.map((t, i) => {
          const isModel = t.type === 'model';
          const isTool = t.type === 'tool';
          const inputMessages = isModel && Array.isArray(t.input) ? t.input : [];
          const lastInputMessage = inputMessages.length > 0 ? inputMessages[inputMessages.length - 1] : null;
          const isNewTurn = isModel && isHumanMessage(lastInputMessage);

          const toolCalls = isModel ? (t.output?.kwargs?.tool_calls || []) : [];
          const usage = isModel ? (t.output?.kwargs?.response_metadata?.tokenUsage || t.output?.kwargs?.usage_metadata) : null;
          const content = isModel ? (t.output?.kwargs?.content) : null;

          return (
            <React.Fragment key={i}>
              {isNewTurn && (
                <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '8px', borderLeft: '4px solid #3182ce' }}>
                  <div style={{ padding: '10px 16px', background: '#f0f7ff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: '#3182ce', color: '#fff' }}>HUMAN</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {usage && (
                        <div style={{ fontSize: '11px', color: '#3182ce', fontWeight: '600' }}>
                          {usage.promptTokens || usage.input_tokens || '0'} Input Tokens
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>User Request</span>
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500', lineHeight: '1.5' }}>
                      {getMessageContent(lastInputMessage)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ padding: '10px 16px', background: isModel ? '#f8fafc' : '#f0fff4', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: isModel ? '#3182ce' : '#10b981', color: '#fff', letterSpacing: '0.05em' }}>{t.type.toUpperCase()}</span>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{t.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{t.latency}ms</div>
                </div>

                <div style={{ padding: '16px' }}>
                  {usage && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px' }}>
                      <div style={{ color: '#64748b' }}><b style={{ color: '#334155' }}>Total Tokens:</b> {usage.totalTokens || usage.total_tokens || 'N/A'}</div>
                      <div style={{ color: '#64748b' }}><b style={{ color: '#334155' }}>Prompt:</b> {usage.promptTokens || usage.input_tokens}</div>
                      <div style={{ color: '#64748b' }}><b style={{ color: '#334155' }}>Completion:</b> {usage.completionTokens || usage.output_tokens}</div>
                    </div>
                  )}

                  {isTool && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '6px' }}>TOOL INPUT</div>
                      <pre style={{ margin: 0, fontSize: '12px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>{JSON.stringify(t.input, null, 2)}</pre>
                    </div>
                  )}

                  {isModel && (
                    <div>
                      {content && (
                        <div style={{ marginBottom: toolCalls.length > 0 ? '12px' : 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '6px' }}>AI RESPONSE</div>
                          <div style={{ fontSize: '13px', lineHeight: '1.5', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>{content}</div>
                        </div>
                      )}
                      {toolCalls.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: '800', color: '#b45309', marginBottom: '6px' }}>TOOL INVOCATION</div>
                          {toolCalls.map((tc: any, idx: number) => (
                            <div key={idx} style={{ padding: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px' }}>
                              <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>{tc?.function?.name || tc?.name}</div>
                              <code style={{ color: '#b45309', wordBreak: 'break-all' }}>{tc?.function?.arguments || JSON.stringify(tc?.args)}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isTool && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '6px' }}>TOOL RESULT</div>
                      <div style={{ fontSize: '12px', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534' }}>{t.output?.kwargs?.content || JSON.stringify(t.output)}</div>
                    </div>
                  )}

                  {t.error && (
                    <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '12px' }}>
                      <b style={{ display: 'block', marginBottom: '4px' }}>Error Encountered:</b>
                      {t.error}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// --- Root App Component ---
const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatId] = useState(() => Math.random().toString(36).substring(7));
  const [traces, setTraces] = useState<TraceStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'traces'>('chat');

  const fetchTraces = async () => {
    try {
      const res = await fetch(`/api/traces/${chatId}`);
      const data = await res.json();
      setTraces(data);
    } catch (e) {
      console.error("Failed to fetch traces:", e);
    }
  };

  const saveChat = async () => {
    if (traces.length === 0) return alert("No traces to save!");
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Trace saved successfully to ${data.path}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save trace.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const history = [...messages, userMessage];
    
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, chatId }),
      });
      
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
      await fetchTraces();
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.025em' }}>Agent Debugger</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={saveChat}
            style={{ 
              fontSize: '12px', background: '#10b981', color: '#fff', border: 'none', 
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' 
            }}
          >
            Save Trace
          </button>
          <div style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            Session: <code style={{ fontWeight: 'bold', color: '#0f172a' }}>{chatId}</code>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1, padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '8px',
            background: activeTab === 'chat' ? '#fff' : 'transparent',
            color: activeTab === 'chat' ? '#0f172a' : '#64748b',
            fontWeight: '600', boxShadow: activeTab === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Conversation
        </button>
        <button 
          onClick={() => { setActiveTab('traces'); fetchTraces(); }}
          style={{
            flex: 1, padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '8px',
            background: activeTab === 'traces' ? '#fff' : 'transparent',
            color: activeTab === 'traces' ? '#0f172a' : '#64748b',
            fontWeight: '600', boxShadow: activeTab === 'traces' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}
        >
          Traces
          <span style={{ fontSize: '11px', background: activeTab === 'traces' ? '#3182ce' : '#e2e8f0', color: activeTab === 'traces' ? '#fff' : '#64748b', padding: '2px 8px', borderRadius: '6px' }}>
            {traces.length}
          </span>
        </button>
      </div>

      {/* Main Viewport */}
      <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        {activeTab === 'chat' ? (
          <Chat 
            messages={messages} 
            input={input} 
            setInput={setInput} 
            sendMessage={sendMessage} 
            loading={loading} 
          />
        ) : (
          <TraceVisualizer traces={traces} />
        )}
      </div>
    </div>
  );
};

export default App;