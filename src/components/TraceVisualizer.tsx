import React from 'react';
import { TraceStep } from '../types.ts';

interface TraceVisualizerProps {
  traces: TraceStep[];
}

const TraceVisualizer: React.FC<TraceVisualizerProps> = ({ traces }) => {
  const isHumanMessage = (m: any) => {
    if (!m) return false;
    // Check for serialized LangChain object (priority to class name in id)
    if (m.id && Array.isArray(m.id)) {
      const classType = m.id[m.id.length - 1];
      if (classType === 'HumanMessage') return true;
    }
    // Check for standard type/role properties
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
          
          // Detect new turn
          const previousTrace = i > 0 ? traces[i - 1] : null;
          const isNewTurn = isModel && isHumanMessage(lastInputMessage);

          const toolCalls = isModel ? (t.output?.kwargs?.tool_calls || []) : [];
          const usage = isModel ? (t.output?.kwargs?.response_metadata?.tokenUsage || t.output?.kwargs?.usage_metadata) : null;
          const content = isModel ? (t.output?.kwargs?.content) : null;

          return (
            <React.Fragment key={i}>
              {/* Render Human Input Card */}
              {isNewTurn && (
                <div style={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  borderLeft: '4px solid #3182ce'
                }}>
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
                    {lastInputMessage.kwargs?.additional_kwargs && Object.keys(lastInputMessage.kwargs.additional_kwargs).length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px' }}>METADATA</div>
                        <pre style={{ margin: 0, fontSize: '11px', background: '#f8fafc', padding: '8px', borderRadius: '6px', overflowX: 'auto' }}>
                          {JSON.stringify(lastInputMessage.kwargs.additional_kwargs, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  padding: '10px 16px', 
                  background: isModel ? '#f8fafc' : '#f0fff4', 
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                      background: isModel ? '#3182ce' : '#10b981',
                      color: '#fff', letterSpacing: '0.05em'
                    }}>
                      {t.type.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{t.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                    {t.latency}ms
                  </div>
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

export default TraceVisualizer;
