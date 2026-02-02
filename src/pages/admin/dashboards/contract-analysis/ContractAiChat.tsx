import { useState, useRef, useEffect, useCallback, memo, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Icon } from '@iconify/react';
import {
  sendTemplateChatMessage,
  sendContractChatMessage,
  type ContractContext,
  type ContractChatResponse,
} from '@/api/services/contract-analysis-api';

// Icons
import botIcon from '@iconify/icons-lucide/bot';
import sendIcon from '@iconify/icons-lucide/send-horizontal';
import sparklesIcon from '@iconify/icons-lucide/sparkles';
import fileTextIcon from '@iconify/icons-lucide/file-text';
import alertTriangleIcon from '@iconify/icons-lucide/alert-triangle';
import shieldIcon from '@iconify/icons-lucide/shield';
import scaleIcon from '@iconify/icons-lucide/scale';
import wifiOffIcon from '@iconify/icons-lucide/wifi-off';
import trash2Icon from '@iconify/icons-lucide/trash-2';
import stopCircleIcon from '@iconify/icons-lucide/stop-circle';
import messageSquareIcon from '@iconify/icons-lucide/message-square';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isRevealing?: boolean;
  referencedClauses?: string[];
}

interface QuickAction {
  icon: typeof botIcon;
  label: string;
  subtitle: string;
  prompt: string;
}

interface ContractAiChatProps {
  templateName?: string;
  templateId?: number;
  contractId?: number;
  overallScore?: number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  totalClauses?: number;
  categoryScores?: {
    payment: number;
    roleResponsibility: number;
    safety: number;
    temporal: number;
    procedure: number;
    definition: number;
    reference: number;
  };
  topRisks?: Array<{
    category: string;
    level: string;
    riskDescription?: string;
    clauseRef?: string;
  }>;
  onClauseReferenceClick?: (clauseNumber: string) => void;
  onReferencedClauses?: (clauseNumbers: string[]) => void;
  clauseNumbers?: string[];
}

export interface ContractAiChatHandle {
  sendMessage: (text: string) => void;
}

// Status messages that rotate during loading
const STATUS_MESSAGES = [
  'Thinking...',
  'Analyzing your question...',
  'Searching for relevant data...',
  'Reviewing contract clauses...',
  'Preparing response...',
];

// Simple markdown renderer for AI responses with clause link support
const FormattedText = memo(({
  text,
  clauseNumbers,
  onClauseClick,
}: {
  text: string;
  clauseNumbers?: string[];
  onClauseClick?: (clauseNumber: string) => void;
}) => {
  const rendered = useMemo(() => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1.5">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{formatInlineWithClauses(item, clauseNumbers, onClauseClick)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Bullet list items
      if (/^[-*•]\s+/.test(trimmed)) {
        listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
        continue;
      }

      // Numbered list items
      if (/^\d+[.)]\s+/.test(trimmed)) {
        listItems.push(trimmed.replace(/^\d+[.)]\s+/, ''));
        continue;
      }

      flushList();

      // Empty line = paragraph break
      if (!trimmed) {
        elements.push(<div key={`br-${i}`} className="h-2" />);
        continue;
      }

      // Regular text paragraph
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed">{formatInlineWithClauses(trimmed, clauseNumbers, onClauseClick)}</p>
      );
    }

    flushList();
    return elements;
  }, [text, clauseNumbers, onClauseClick]);

  return <div className="space-y-0.5">{rendered}</div>;
});
FormattedText.displayName = 'FormattedText';

// Inline formatting with clause reference linking
// Strategy: split by clause references FIRST on raw text, then apply markdown to non-clause segments
function formatInlineWithClauses(
  text: string,
  clauseNumbers?: string[],
  onClauseClick?: (clauseNumber: string) => void,
): React.ReactNode {
  // If no clause numbers or no click handler, just apply markdown formatting
  if (!clauseNumbers?.length || !onClauseClick) {
    return formatInline(text);
  }

  // Build regex from known clause numbers (escape special chars, sort longest first)
  const escaped = clauseNumbers
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(cn => cn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) return formatInline(text);

  const clauseRegex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = clauseRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(formatInline(text.slice(lastIndex, match.index)));
    }

    const matchedClause = clauseNumbers.find(
      cn => cn.toLowerCase() === match![0].toLowerCase()
    ) || match[0];

    parts.push(
      <button
        key={`clause-${key++}`}
        onClick={() => onClauseClick(matchedClause)}
        className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary font-medium cursor-pointer bg-transparent border-none p-0 text-sm"
        title={`Go to ${matchedClause}`}
      >
        {match[0]}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return formatInline(text);

  if (lastIndex < text.length) {
    parts.push(formatInline(text.slice(lastIndex)));
  }

  return <>{parts}</>;
}

// Inline formatting: **bold**, *italic*, `code`
function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={key++} className="px-1 py-0.5 bg-base-200 rounded text-xs font-mono">
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

// Breathing avatar with glow effect - uses theme colors (bg-base-200, border-base-300, text-primary)
const BreathingAvatar = memo(() => {
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const intensity = (Math.sin(elapsed * Math.PI) + 1) / 2; // 0 to 1, 1s cycle
      const scale = 1 + intensity * 0.1;
      const tilt = intensity * 6;

      if (avatarRef.current) {
        avatarRef.current.style.transform = `scale(${scale}) rotate(${tilt}deg)`;
        avatarRef.current.style.boxShadow = `0 0 0 ${1 + intensity * 2}px oklch(var(--p) / ${0.15 + intensity * 0.15})`;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      ref={avatarRef}
      className="w-8 h-8 rounded-full bg-base-200 border border-base-300 flex items-center justify-center shadow-sm transition-none"
    >
      <Icon icon={botIcon} className="w-5 h-5 text-primary" />
    </div>
  );
});
BreathingAvatar.displayName = 'BreathingAvatar';

// Typing indicator with breathing avatar, bouncing dots, and rotating status
const TypingIndicator = memo(() => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-3 items-center">
      <div className="flex-shrink-0">
        <BreathingAvatar />
      </div>
      <div>
        <div className="bg-base-200 rounded-2xl rounded-bl-sm inline-flex items-center justify-center gap-1.5 px-3 py-2">
          <div
            className="w-1.5 h-1.5 bg-base-content/50 rounded-full"
            style={{ animation: 'typing-bounce 1.2s ease-in-out infinite' }}
          />
          <div
            className="w-1.5 h-1.5 bg-base-content/50 rounded-full"
            style={{ animation: 'typing-bounce 1.2s ease-in-out 0.2s infinite' }}
          />
          <div
            className="w-1.5 h-1.5 bg-base-content/50 rounded-full"
            style={{ animation: 'typing-bounce 1.2s ease-in-out 0.4s infinite' }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 animate-fadeIn" key={statusIndex}>
          <Icon icon={messageSquareIcon} className="w-3 h-3 text-base-content/40" />
          <span className="text-xs text-base-content/40">{STATUS_MESSAGES[statusIndex]}</span>
        </div>
      </div>
    </div>
  );
});
TypingIndicator.displayName = 'TypingIndicator';

// Message bubble component
const MessageBubble = memo(({
  message,
  isFirstInGroup,
  clauseNumbers,
  onClauseClick,
}: {
  message: Message;
  isFirstInGroup: boolean;
  clauseNumbers?: string[];
  onClauseClick?: (clauseNumber: string) => void;
}) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="group relative max-w-[85%]">
          <div className="bg-base-200 text-base-content px-3 py-2 rounded-2xl shadow-sm border border-base-300">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
          <div className="absolute right-0 -bottom-5 text-[10px] text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      {isFirstInGroup ? (
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${
            isError ? 'bg-error/10 border-error/30' : 'bg-base-200 border-base-300'
          }`}>
            <Icon icon={isError ? wifiOffIcon : botIcon} className={`w-5 h-5 ${isError ? 'text-error' : 'text-primary'}`} />
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 w-8" />
      )}

      <div className="group relative flex-1 min-w-0">
        {isFirstInGroup && (
          <span className={`text-xs font-semibold mb-1 block ${isError ? 'text-error' : 'text-base-content/70'}`}>
            {isError ? 'Error' : 'Contract AI'}
          </span>
        )}
        <div className={`${isError ? 'text-error/80' : 'text-base-content'}`}>
          {isError ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
          ) : (
            <FormattedText
              text={message.content}
              clauseNumbers={clauseNumbers}
              onClauseClick={onClauseClick}
            />
          )}
        </div>
        <div className="absolute left-0 -bottom-5 text-[10px] text-base-content/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// Quick action card
const QuickActionCard = memo(({
  action,
  onClick,
}: {
  action: QuickAction;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="relative group bg-base-200/60 hover:bg-base-200 rounded-lg p-2.5 transition-all duration-200 border border-base-300/50 hover:border-base-300 hover:shadow-sm text-left"
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-md bg-base-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon
          icon={action.icon}
          className="w-4 h-4 text-base-content/70 group-hover:text-primary transition-colors"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-base-content truncate">
          {action.label}
        </div>
        <div className="text-[10px] text-base-content/50 truncate leading-tight">
          {action.subtitle}
        </div>
      </div>
    </div>
  </button>
));
QuickActionCard.displayName = 'QuickActionCard';

// Welcome state component
const WelcomeState = memo(({
  quickActions,
  onActionClick,
}: {
  quickActions: QuickAction[];
  onActionClick: (prompt: string) => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full px-4 py-8">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <Icon icon={sparklesIcon} className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-base-content mb-1">
      Contract AI Assistant
    </h3>
    <p className="text-xs text-base-content/60 text-center mb-6 max-w-[280px]">
      Ask questions about this contract's risks, clauses, or get recommendations
    </p>
    <div className="w-full grid grid-cols-2 gap-2">
      {quickActions.map((action, index) => (
        <QuickActionCard
          key={index}
          action={action}
          onClick={() => onActionClick(action.prompt)}
        />
      ))}
    </div>
  </div>
));
WelcomeState.displayName = 'WelcomeState';

// Main component
const ContractAiChat = forwardRef<ContractAiChatHandle, ContractAiChatProps>(({
  templateName = 'Contract',
  templateId,
  contractId,
  overallScore,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  totalClauses,
  categoryScores,
  topRisks,
  onClauseReferenceClick,
  onReferencedClauses,
  clauseNumbers,
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [revealedText, setRevealedText] = useState<string>('');
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quickActions: QuickAction[] = [
    {
      icon: alertTriangleIcon,
      label: 'Top Risks',
      subtitle: 'Key risk areas',
      prompt: 'What are the most critical risks in this contract I should address first? Provide both client and subcontractor perspectives.',
    },
    {
      icon: fileTextIcon,
      label: 'Summary',
      subtitle: 'Contract overview',
      prompt: 'Give me a summary of this contract analysis and its overall health, from both client and subcontractor perspectives.',
    },
    {
      icon: shieldIcon,
      label: 'Recommendations',
      subtitle: 'Improve safety',
      prompt: 'What specific changes would you recommend to improve this contract risk profile? Consider both client protection and fair subcontractor terms.',
    },
    {
      icon: scaleIcon,
      label: 'Legal Concerns',
      subtitle: 'Compliance issues',
      prompt: 'Are there any legal or compliance concerns I should be aware of? Analyze from both the client and subcontractor standpoint.',
    },
  ];

  // Build context for the API
  const buildContext = useCallback((): ContractContext => {
    return {
      templateName,
      templateId,
      contractId,
      overallScore,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalClauses,
      categoryScores,
      topRisks: topRisks?.map(r => ({
        category: r.category,
        level: r.level,
        description: r.riskDescription || '',
        clauseRef: r.clauseRef,
      })),
      clauseNumbers,
    };
  }, [templateName, templateId, contractId, overallScore, criticalCount, highCount, mediumCount, lowCount, totalClauses, categoryScores, topRisks, clauseNumbers]);

  // Text reveal effect
  const revealText = useCallback((fullText: string, messageId: string) => {
    setRevealingId(messageId);
    setRevealedText('');
    let index = 0;
    const chunkSize = 4;
    const delay = 4;

    const reveal = () => {
      index += chunkSize;
      if (index >= fullText.length) {
        setRevealedText(fullText);
        setRevealingId(null);
        return;
      }
      setRevealedText(fullText.slice(0, index));
      revealTimerRef.current = setTimeout(reveal, delay);
    };

    revealTimerRef.current = setTimeout(reveal, delay);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, revealedText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  // Auto-resize textarea
  const handleTextareaInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  }, []);

  // Handle stop/abort
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  // Send message to AI via API
  const sendToAI = useCallback(async (userMessage: string) => {
    setIsLoading(true);

    // Cancel any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const context = buildContext();
      let result: ContractChatResponse;

      if (templateId) {
        result = await sendTemplateChatMessage(
          templateId,
          userMessage,
          context,
          sessionId,
          abortControllerRef.current.signal
        );
      } else if (contractId) {
        result = await sendContractChatMessage(
          contractId,
          userMessage,
          context,
          sessionId,
          abortControllerRef.current.signal
        );
      } else {
        throw new Error('No template or contract ID provided');
      }

      if (result.success) {
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }

        const messageId = Date.now().toString();
        const assistantMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          isRevealing: true,
          referencedClauses: result.referencedClauses,
        };

        setMessages(prev => [...prev, assistantMessage]);
        revealText(result.response, messageId);

        // Notify parent about referenced clauses
        if (result.referencedClauses?.length && onReferencedClauses) {
          onReferencedClauses(result.referencedClauses);
        }
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.error || 'An error occurred. Please try again.',
          timestamp: new Date(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, a connection error occurred. Please check your connection and try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [templateId, contractId, sessionId, buildContext, revealText, onReferencedClauses]);

  // Handle send message
  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendToAI(messageText);
  }, [inputValue, isLoading, sendToAI]);

  // Expose sendMessage via ref
  useImperativeHandle(ref, () => ({
    sendMessage: (text: string) => {
      handleSend(text);
    },
  }), [handleSend]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  }, [handleSend]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Check if message is first in a group from same sender
  const isFirstInGroup = useCallback((index: number) => {
    if (index === 0) return true;
    return messages[index].role !== messages[index - 1].role;
  }, [messages]);

  // Clear chat history
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setRevealingId(null);
    setRevealedText('');
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  }, []);

  // Get display content for a message (handles text reveal)
  const getDisplayContent = useCallback((message: Message): string => {
    if (revealingId === message.id) {
      return revealedText;
    }
    return message.content;
  }, [revealingId, revealedText]);

  return (
    <div className="flex flex-col h-full bg-base-100/50 backdrop-blur-sm rounded-xl border border-base-300/50 overflow-hidden" style={{ minHeight: '400px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
          <WelcomeState quickActions={quickActions} onActionClick={handleSend} />
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={{
                  ...message,
                  content: getDisplayContent(message),
                }}
                isFirstInGroup={isFirstInGroup(index)}
                clauseNumbers={[...new Set([...(clauseNumbers || []), ...(message.referencedClauses || [])])]}
                onClauseClick={onClauseReferenceClick}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-base-300/50 p-3">
        <form onSubmit={handleSubmit}>
          <div className="bg-base-200 rounded-xl border border-base-300">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this contract..."
              className="w-full resize-none bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-base-content/50 text-base-content px-4 pt-3 pb-0 text-sm leading-relaxed"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <div>
                {messages.length > 0 && !isLoading && (
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="btn btn-sm btn-ghost btn-circle text-base-content/50 hover:text-error hover:bg-error/10"
                    title="Effacer la conversation"
                  >
                    <Icon icon={trash2Icon} className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="btn btn-sm btn-ghost btn-circle text-error animate-pulse"
                  title="Stop"
                >
                  <Icon icon={stopCircleIcon} className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="btn btn-sm btn-circle bg-base-content text-base-100 hover:bg-base-content/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon icon={sendIcon} className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
});

ContractAiChat.displayName = 'ContractAiChat';

export default ContractAiChat;
