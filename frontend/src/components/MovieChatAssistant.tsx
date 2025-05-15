'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Send, Bot, User, Sparkles, ChevronDown, 
  Film, MessageSquare, Loader2 
} from 'lucide-react';
import { DialogContent, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
  isTyping?: boolean;
}

interface MovieChatAssistantProps {
  movieId: number;
  movieTitle: string;
}

export function MovieChatAssistant({ movieId, movieTitle }: MovieChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    const container = chatContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await axios.post('/chatbot/movie-details', {
        movie_id: movieId,
        question: input
      });

      setTimeout(() => {
        setIsTyping(false);
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.answer,
          source: response.data.source || 'Assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);

    } catch (error) {
      console.error('Error getting answer:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I could not get an answer at this time. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What's the plot?",
    "Who directed this movie?",
    "What's the rating?",
    "Similar movies?"
  ];

  return (
    <DialogContent className="max-w-lg h-[700px] flex flex-col p-0 overflow-hidden">
      <DialogTitle className="sr-only">Chat about {movieTitle}</DialogTitle>
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <Card className="border-0 h-full flex flex-col shadow-2xl backdrop-blur-sm">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
                <Bot className="h-6 w-6 text-primary relative z-10" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Movie Assistant</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {movieTitle}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="text-center mt-8 animate-fade-in">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Hi! I am your AI assistant for &quot;{movieTitle}&quot;. Ask me anything!
                </p>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "text-xs animate-scale-in hover:border-primary/50",
                        "transition-all duration-300 hover:scale-105"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => {
                        setInput(question);
                        sendMessage();
                      }}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex animate-slide-in",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl p-4 transition-all duration-300",
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg'
                          : 'bg-muted/50 backdrop-blur-sm border border-border/50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-1 rounded-full",
                          message.role === 'user' ? 'bg-white/20' : 'bg-primary/10'
                        )}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.source === 'OpenAI' && (
                          <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
                        )}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-muted/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {showScrollButton && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-20 right-4 rounded-full shadow-lg animate-fade-in"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          
          <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="Ask about this movie..."
                disabled={isLoading}
                className={cn(
                  "flex-1 h-11 border-2 transition-all duration-300",
                  "focus:border-primary focus:shadow-lg focus:shadow-primary/20"
                )}
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
                className={cn(
                  "h-11 w-11 p-0 transition-all duration-300",
                  "bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by AI • Type your question above
            </p>
          </div>
        </CardContent>
      </Card>
    </DialogContent>
  );
}