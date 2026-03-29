import image_404faa741eb4394d917a24330c1566de438eea2b from 'figma:asset/404faa741eb4394d917a24330c1566de438eea2b.png'
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Send, HeadphonesIcon, X, Bot, User as UserIcon, Bell, MessageSquare, Clock, Check, CheckCheck, Sparkles } from 'lucide-react';
import { storageUtils } from '../utils/storage';
import { ChatConversation, ChatMessage, User, PopupMessage } from '../types/index';
import { toast } from 'sonner@2.0.3';

interface HelpCenterProps {
  user: User;
  onClose: () => void;
}

export function HelpCenter({ user, onClose }: HelpCenterProps) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications'>('chat');
  const [adminNotifications, setAdminNotifications] = useState<PopupMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadConversation = () => {
      const conversations = storageUtils.getChatConversations();
      let userConversation = conversations.find(c => c.userId === user.id);
      
      if (!userConversation) {
        userConversation = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          messages: [],
          status: 'open',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          createdAt: new Date().toISOString()
        };
        storageUtils.addChatConversation(userConversation);
      }
      
      setConversation(userConversation);
    };

    loadConversation();
    
    const popups = storageUtils.getPopupMessages();
    const userPopups = popups.filter(p => 
      p.isActive && 
      (p.targetAudience === 'all' || 
      (user.emailVerified ? p.targetAudience === 'verified' : p.targetAudience === 'unverified'))
    );
    setAdminNotifications(userPopups.sort((a, b) => b.priority - a.priority));
    
    pollingRef.current = setInterval(() => {
      const conversations = storageUtils.getChatConversations();
      const updatedConv = conversations.find(c => c.userId === user.id);
      if (updatedConv) {
        setConversation(prev => {
          if (prev && updatedConv.messages.length !== prev.messages.length) {
            return updatedConv;
          }
          return prev;
        });
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [conversation?.messages.length, activeTab]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (textOverride?: string) => {
    const messageToSend = textOverride || message.trim();
    if (!messageToSend || !conversation) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      conversationId: conversation.id,
      userId: user.id,
      userName: user.name || user.email,
      userEmail: user.email,
      message: messageToSend,
      sender: 'customer',
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedConversation: ChatConversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessageAt: new Date().toISOString(),
      unreadCount: conversation.unreadCount + 1
    };

    storageUtils.updateChatConversation(conversation.id, updatedConversation);
    setConversation(updatedConversation);
    if (!textOverride) setMessage('');
    
    const aiConfig = storageUtils.getAIConfig();
    if (aiConfig.isEnabled && aiConfig.autoReply) {
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: conversation.id,
          userId: 'ai-bot',
          userName: 'Toodies Butler',
          userEmail: 'ai@toodies.com',
          message: aiConfig.greetingMessage || "Your request is being processed with the utmost priority. A Toodies ambassador will be with you momentarily.",
          sender: 'ai',
          timestamp: new Date().toISOString(),
          read: false
        };
        
        const latestConvs = storageUtils.getChatConversations();
        const currentConv = latestConvs.find(c => c.id === conversation.id);
        if (currentConv) {
          const withAI = {
            ...currentConv,
            messages: [...currentConv.messages, aiMessage],
            lastMessageAt: new Date().toISOString()
          };
          storageUtils.updateChatConversation(conversation.id, withAI);
          setConversation(withAI);
        }
      }, 1500);
    }
  };

  const handleQuickAction = (text: string) => {
    handleSendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMsg: ChatMessage, prevMsg: ChatMessage | undefined) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  const shouldGroupMessage = (currentMsg: ChatMessage, prevMsg: ChatMessage | undefined) => {
    if (!prevMsg) return false;
    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return currentMsg.sender === prevMsg.sender && timeDiff < fiveMinutes;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[650px] z-50 flex items-end md:items-center justify-center md:justify-end p-0 md:p-4 selection:bg-[#d4af37]/30"
    >
      <Card className="glass-card border-[#d4af37]/30 w-full h-full md:h-[650px] flex flex-col overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] rounded-[32px] luxury-glow bg-black">
        {/* Header */}
        <CardHeader className="border-b border-white/5 flex-shrink-0 bg-black/80 backdrop-blur-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <HeadphonesIcon className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div>
                <CardTitle className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  Toodies Concierge
                  <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse shadow-[0_0_8px_#d4af37]" />
                </CardTitle>
                <CardDescription className="text-slate-500 text-[9px] uppercase tracking-[3px] font-bold">
                  Bespoke Support 24/7
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl h-10 w-10 transition-all border border-white/5"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <Button
              onClick={() => setActiveTab('chat')}
              variant="ghost"
              className={`flex-1 h-11 rounded-xl text-[10px] font-bold uppercase tracking-[2px] transition-all gap-2 ${
                activeTab === 'chat' 
                  ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </Button>
            <Button
              onClick={() => setActiveTab('notifications')}
              variant="ghost"
              className={`flex-1 h-11 rounded-xl text-[10px] font-bold uppercase tracking-[2px] transition-all gap-2 relative ${
                activeTab === 'notifications' 
                  ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Updates
              {adminNotifications.length > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 bg-white text-black text-[8px] font-black flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                  {adminNotifications.length}
                </span>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Content Area */}
        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-black/40">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
                  {!conversation || conversation.messages.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center">
                      <div className="w-24 h-24 rounded-[32px] bg-[#d4af37]/5 border border-[#d4af37]/10 flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-[#d4af37]/5 rounded-[32px] blur-2xl animate-pulse" />
                        <Sparkles src={image_404faa741eb4394d917a24330c1566de438eea2b} className="w-10 h-10 text-[#d4af37]/40 relative z-10" />
                      </div>
                      <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-3">Exquisite Assistance</h3>
                      <p className="text-slate-500 text-sm max-w-[260px] mb-10 leading-relaxed font-light">
                        How may we elevate your Toodies experience today? Select a consultation topic below.
                      </p>
                      
                      <div className="w-full max-w-[320px] space-y-3">
                        {[
                          { title: "Curation Status", desc: "Track your bespoke order" },
                          { title: "Atelier Inquiry", desc: "Help with the designer tool" },
                          { title: "Fiscal Support", desc: "Payment & refund protocols" }
                        ].map((topic, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            className="w-full justify-start h-auto py-4 px-5 bg-white/[0.02] hover:bg-[#d4af37]/5 border border-white/5 hover:border-[#d4af37]/30 rounded-2xl transition-all group"
                            onClick={() => handleQuickAction(`I require information regarding ${topic.title.toLowerCase()}`)}
                          >
                            <div className="text-left">
                              <div className="text-[11px] font-black text-white uppercase tracking-widest group-hover:text-[#d4af37] transition-colors">{topic.title}</div>
                              <div className="text-[9px] text-slate-600 uppercase tracking-tighter mt-1">{topic.desc}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {conversation.messages.map((msg, index) => {
                        const prevMsg = index > 0 ? conversation.messages[index - 1] : undefined;
                        const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                        const isGrouped = shouldGroupMessage(msg, prevMsg);
                        
                        return (
                          <div key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-8">
                                <div className="h-px w-12 bg-white/5" />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[3px] mx-4">
                                  {formatDate(msg.timestamp)}
                                </span>
                                <div className="h-px w-12 bg-white/5" />
                              </div>
                            )}

                            <div
                              className={`flex gap-3 ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-6'}`}
                            >
                              {msg.sender !== 'customer' && !isGrouped && (
                                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  {msg.sender === 'ai' ? (
                                    <Bot className="w-4 h-4 text-[#d4af37]" />
                                  ) : (
                                    <HeadphonesIcon className="w-4 h-4 text-[#d4af37]" />
                                  )}
                                </div>
                              )}
                              
                              {msg.sender !== 'customer' && isGrouped && <div className="w-9" />}
                              
                              <div className={`flex flex-col ${msg.sender === 'customer' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                {!isGrouped && (
                                  <span className={`text-[8px] font-black uppercase tracking-[2px] mb-2 px-1 ${
                                    msg.sender === 'customer' ? 'text-[#d4af37]' : 'text-slate-500'
                                  }`}>
                                    {msg.sender === 'customer' ? 'Client' : 
                                     msg.sender === 'ai' ? 'Butler' : 'Ambassador'}
                                  </span>
                                )}
                                
                                <div
                                  className={`rounded-2xl px-5 py-3.5 text-[13px] leading-relaxed shadow-lg ${
                                    msg.sender === 'customer'
                                      ? 'bg-[#d4af37] text-black font-medium rounded-tr-sm'
                                      : 'bg-white/[0.03] text-slate-200 border border-white/10 rounded-tl-sm'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                
                                <div className={`flex items-center gap-2 mt-2 px-1 ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <span className="text-[8px] font-bold text-slate-700 tracking-tighter uppercase">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                  {msg.sender === 'customer' && (
                                    <div className="flex items-center">
                                      {msg.read ? (
                                        <CheckCheck className="w-3 h-3 text-[#d4af37]" />
                                      ) : (
                                        <Check className="w-3 h-3 text-slate-800" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {msg.sender === 'customer' && !isGrouped && (
                                <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="w-4 h-4 text-[#d4af37]" />
                                </div>
                              )}
                              
                              {msg.sender === 'customer' && isGrouped && <div className="w-9" />}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} className="h-4" />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-black border-t border-white/5">
                  <div className="flex gap-3 relative">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Compose your message..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus:border-[#d4af37]/50 h-14 rounded-2xl pr-16 transition-all"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!message.trim()}
                      className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-[#d4af37] hover:bg-[#c9a227] text-black border-0 disabled:opacity-20 transition-all p-0 shadow-lg shadow-[#d4af37]/10"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#d4af37] animate-pulse" />
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-[2px]">Ambassadors Active</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 text-slate-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      </div>
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-[2px]">Secure Channel</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="notif-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black text-[#d4af37] uppercase tracking-[3px] flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" />
                    Protocol Updates
                  </h3>
                  <span className="text-[8px] text-slate-600 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 font-black uppercase tracking-tighter">
                    {adminNotifications.length} Archives
                  </span>
                </div>
                
                {adminNotifications.length === 0 ? (
                  <div className="text-center py-32 flex flex-col items-center opacity-20">
                    <Bell className="w-12 h-12 text-slate-500 mb-6" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px]">No new transmissions.</p>
                  </div>
                ) : (
                  adminNotifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group hover:border-[#d4af37]/30 transition-all duration-500"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37] opacity-20" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            notif.type === 'coupon' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                            'bg-white/5 text-white'
                          }`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h4 className="text-white font-black text-sm uppercase tracking-tight">{notif.title}</h4>
                        </div>
                        <span className="text-[7px] font-black text-slate-700 uppercase bg-white/5 px-2 py-1 rounded-md border border-white/5 tracking-[2px]">
                          Official
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-xs leading-relaxed font-light mb-6">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-[2px]">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {notif.link && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-[9px] font-black text-[#d4af37] hover:text-white uppercase tracking-[2px] transition-colors"
                            onClick={() => window.open(notif.link, '_blank')}
                          >
                            Explore Detail
                          </Button>
                        )}
                      </div>
                      
                      {notif.couponCode && (
                        <div className="mt-4 p-3 bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-xl flex items-center justify-between">
                          <code className="text-[11px] font-mono text-[#d4af37] font-black tracking-widest">{notif.couponCode}</code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[8px] font-black text-[#d4af37]/60 uppercase tracking-widest"
                            onClick={() => {
                              navigator.clipboard.writeText(notif.couponCode!);
                              toast.success('Protocol code secured.');
                            }}
                          >
                            Secure Code
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
