import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Send, Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Conversation, Message } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

interface Props {
  conversationId: string;
  onBack: () => void;
}

type ChatMessage = Message & { isOptimistic?: boolean };

export default function ChatPage({ conversationId, onBack }: Props) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState('');
  const [loadError, setLoadError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markAsRead = useCallback(async () => {
    if (!user || !messages.length) return;
    
    // Mark all unread messages where I am the receiver as read
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    if (error) console.error('Error marking messages as read:', error);
  }, [conversationId, user, messages.length]);

  useEffect(() => {
    scrollToBottom();
    markAsRead();
  }, [messages, scrollToBottom, markAsRead]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    try {
      // Load conversation with all relationships
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select(
          `
          id,
          item_id,
          buyer_id,
          seller_id,
          created_at,
          item:items!item_id(id, title, price, photos),
          buyer:profiles!buyer_id(id, full_name, avatar_url),
          seller:profiles!seller_id(id, full_name, avatar_url)
          `
        )
        .eq('id', conversationId)
        .maybeSingle();

      if (convErr) throw convErr;
      if (!conv) throw new Error('Conversation not found');

      setConversation(conv as Conversation | null);

      // Load messages
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgsErr) throw msgsErr;
      setMessages((msgs as ChatMessage[]) ?? []);
    } catch (err: any) {
      console.error('Load error:', err);
      setLoadError(err.message || 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!user) return;
    load();

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Replace the optimistic message with the server version
            // This handles the transition from local state to server truth
            if (prev.some(m => m.id === newMessage.id)) {
              return prev.map(m => m.id === newMessage.id ? newMessage : m);
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to messages');
        } else if (status === 'SUBSCRIPTION_ERROR' || status === 'TIMED_OUT') {
          console.error('Subscription error:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, load]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || sending) return;

    setSendError('');
    const body = text.trim();
    setText('');

    // Generate a unique ID for the optimistic update
    const tempId = crypto.randomUUID();
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      body,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Update UI immediately before the network request
    setMessages((prev) => [...prev, optimisticMessage]);
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        id: tempId, // Pass the ID so Supabase uses our pre-generated UUID
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      } as never);

      if (error) {
        console.error('Send error:', error);
        setSendError('Failed to send message. Please try again.');
        // Rollback optimistic update on failure
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        setText(body); // restore text on error
      }
    } catch (err) {
      console.error('Send error:', err);
      setSendError('Failed to send message. Please try again.');
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setText(body);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size={28} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={32} />
        </div>
        <p className="text-gray-900 font-bold mb-2">Failed to load chat</p>
        <p className="text-sm text-gray-500 mb-6">{loadError}</p>
        <button onClick={load} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold active:scale-95 transition-all">
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  const otherParty = user?.id === conversation?.buyer_id
    ? conversation?.seller
    : conversation?.buyer;

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (ts: string) => {
    const date = new Date(ts);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc: Record<string, ChatMessage[]>, msg) => {
    const date = formatDate(msg.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-30">
        <button 
          onClick={onBack} 
          className="p-1 -ml-1 text-gray-600 active:bg-gray-100 rounded-lg"
          aria-label="Back to messages list"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
          {otherParty?.full_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">{otherParty?.full_name ?? 'Chat'}</p>
          {conversation?.item && (
            <p className="text-xs text-gray-400 truncate">Re: {conversation.item.title}</p>
          )}
        </div>
      </div>

      {/* Item preview */}
      {conversation?.item && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-2.5 flex items-center gap-2.5">
          {conversation.item.photos?.[0] && (
            <img
              src={conversation.item.photos[0]}
              alt=""
              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-700 truncate">{conversation.item.title}</p>
            <p className="text-xs text-orange-600 font-extrabold">₦{Number(conversation.item.price).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            <p className="font-medium">Say hi to start the conversation!</p>
            <p className="text-xs mt-1">Be friendly and ask questions about the item.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs text-gray-400 font-medium px-2">{date}</p>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {dayMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 break-words ${
                          isMe
                            ? 'bg-orange-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                        }`}
                        aria-label={`${isMe ? 'Your message' : 'Message from seller'}`}
                      >
                        <p className="text-sm leading-relaxed">{msg.body}</p>
                        <p
                          className={`text-[10px] mt-1 text-right font-medium ${
                            isMe ? 'text-orange-200' : 'text-gray-400'
                          }`}
                        >
                          {msg.isOptimistic ? 'Sending...' : formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom flex items-end gap-2 shadow-lg">
        {sendError && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-50 text-red-600 text-xs rounded-lg p-2 border border-red-200">
            {sendError}
          </div>
        )}
        <form onSubmit={sendMessage} className="flex-1 flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 max-h-24 bg-gray-50"
            aria-label="Type message"
            required
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white p-3 rounded-full disabled:opacity-40 transition-all active:scale-95 flex-shrink-0 shadow-md"
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
      </div>
      </div>
    </ErrorBoundary>
  );
}
