'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Bot, User, Sparkles, Zap, Copy, ThumbsUp, ThumbsDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils'
import { modalOverlayClass } from '@/utils/theme';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes';

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  actions?: ActionButton[];
}

interface AIChatbotProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AIChatbot({ isOpen, setIsOpen }: AIChatbotProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hello! I'm your AI assistant for the FAM Portal. I can help you with:\n\n• Managing customers and orders\n• Creating meal plans\n• Product and package management\n• Analytics and reports\n• System navigation\n\nWhat would you like help with today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        actions: response.actions,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (input: string): { content: string; actions?: ActionButton[] } => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('customer') || lowerInput.includes('user')) {
      return {
        content: "I can help you with customer management! Here are some quick actions:",
        actions: [
          {
            label: "View all customers",
            action: () => { setIsOpen(false); router.push("/customers"); },
            variant: "outline"
          },
          {
            label: "Add new customer",
            action: () => { setIsOpen(false); router.push("/customers/add"); },
            variant: "secondary"
          },
          {
            label: "Search customers",
            action: () => { setIsOpen(false); router.push("/customers"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('order') || lowerInput.includes('purchase')) {
      return {
        content: "For order management, I can assist with these actions:",
        actions: [
          {
            label: "Create new order",
            action: () => { setIsOpen(false); router.push("/orders/new"); },
            variant: "secondary"
          },
          {
            label: "View all orders",
            action: () => { setIsOpen(false); router.push("/orders"); },
            variant: "outline"
          },
          {
            label: "Track order status",
            action: () => { setIsOpen(false); router.push("/orders?status=processing"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('meal') || lowerInput.includes('plan') || lowerInput.includes('nutrition') || lowerInput.includes('nutritionist')) {
      return {
        content: "Nutrition and meal planning features I can help with:",
        actions: [
          {
            label: "View nutritionists",
            action: () => { setIsOpen(false); router.push("/nutritionists"); },
            variant: "secondary"
          },
          {
            label: "Add new nutritionist",
            action: () => { setIsOpen(false); router.push("/nutritionists/add"); },
            variant: "outline"
          },
          {
            label: "View customer meal plans",
            action: () => { setIsOpen(false); router.push("/customers"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('product') || lowerInput.includes('inventory') || lowerInput.includes('add product') || lowerInput.includes('create product')) {
      return {
        content: "Product management capabilities:",
        actions: [
          {
            label: "Add new product",
            action: () => { setIsOpen(false); router.push("/products/new"); },
            variant: "secondary"
          },
          {
            label: "View all products",
            action: () => { setIsOpen(false); router.push("/products"); },
            variant: "outline"
          },
          {
            label: "Manage inventory",
            action: () => { setIsOpen(false); router.push("/products?inventory=true"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('package') || lowerInput.includes('bundle')) {
      return {
        content: "Package management features:",
        actions: [
          {
            label: "Create new package",
            action: () => { setIsOpen(false); router.push("/packages/new"); },
            variant: "secondary"
          },
          {
            label: "View all packages",
            action: () => { setIsOpen(false); router.push("/packages"); },
            variant: "outline"
          },
          {
            label: "Edit packages",
            action: () => { setIsOpen(false); router.push("/packages"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('report') || lowerInput.includes('analytics') || lowerInput.includes('stats')) {
      return {
        content: "Analytics and reporting tools:",
        actions: [
          {
            label: "Dashboard metrics",
            action: () => { setIsOpen(false); router.push("/"); },
            variant: "outline"
          },
          {
            label: "User settings",
            action: () => { setIsOpen(false); router.push(ROUTES.settings); },
            variant: "outline"
          },
          {
            label: "User controls",
            action: () => { setIsOpen(false); router.push("/user-control"); },
            variant: "outline"
          }
        ]
      };
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('how') || lowerInput.includes('guide')) {
      return {
        content: "I'm here to help! Here are the main areas I can assist with:",
        actions: [
          {
            label: "Dashboard",
            action: () => { setIsOpen(false); router.push("/"); },
            variant: "outline"
          },
          {
            label: "Customers",
            action: () => { setIsOpen(false); router.push("/customers"); },
            variant: "outline"
          },
          {
            label: "Orders",
            action: () => { setIsOpen(false); router.push("/orders"); },
            variant: "outline"
          },
          {
            label: "Products",
            action: () => { setIsOpen(false); router.push("/products"); },
            variant: "outline"
          },
          {
            label: "Packages",
            action: () => { setIsOpen(false); router.push("/packages"); },
            variant: "outline"
          },
          {
            label: "Nutritionists",
            action: () => { setIsOpen(false); router.push("/nutritionists"); },
            variant: "outline"
          },
          {
            label: "Categories",
            action: () => { setIsOpen(false); router.push("/categories"); },
            variant: "outline"
          },
          {
            label: "Settings",
            action: () => { setIsOpen(false); router.push(ROUTES.settings); },
            variant: "outline"
          }
        ]
      };
    }
    
    // Default responses
    const defaultResponses = [
      "That's an interesting question! Could you provide more details about what you're trying to accomplish? I'm here to help with any FAM Portal features.",
      "I'd be happy to help! Can you tell me more about what specific task or feature you need assistance with?",
      "Great question! To give you the most helpful response, could you clarify which area of the FAM Portal you're working with?",
      "I'm here to assist! Let me know what specific functionality you'd like help with, and I'll provide detailed guidance."
    ];
    
    return {
      content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const quickActions = [
    { label: 'Add new customer', action: () => setInputValue('How do I add a new customer?') },
    { label: 'Add nutritionist', action: () => setInputValue('How do I add a new nutritionist?') },
    { label: 'Manage orders', action: () => setInputValue('Help me with order management') },
    { label: 'Create package', action: () => setInputValue('How do I create a new package?') },
    { label: 'User settings', action: () => setInputValue('How do I change user settings?') }
  ];

  return (
    <>

      {/* Background Blur Overlay */}
      {isOpen && (
        <div
          className={cn(
            modalOverlayClass,
            'fixed inset-0 z-40 animate-in fade-in duration-300'
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Chat Modal - Full Height with Smooth Transitions */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full transition-all duration-500 ease-out",
        "w-[500px] max-w-[90vw] sm:max-w-[500px]",
        isOpen 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0 pointer-events-none"
      )}>
        <Card className="h-full shadow-2xl border-l border-y-0 border-r-0 bg-background/80 backdrop-blur-xl rounded-none rounded-l-2xl overflow-hidden">
          {/* Sticky Header */}
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b shadow-sm sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Bot className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center shadow-md">
                    <Sparkles className="h-2.5 w-2.5 text-white animate-spin [animation-duration:3s]" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Online & Ready</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  <Zap className="w-3 h-3 mr-1 animate-pulse" />
                  AI Powered
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-105"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages - Scrollable Area */}
          <CardContent className="flex flex-col h-[calc(100vh-90px)] p-0 overflow-hidden">
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 group",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender === 'ai' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 relative",
                        message.sender === 'user' 
                          ? "bg-primary text-primary-foreground ml-auto" 
                          : "bg-card/90 backdrop-blur-sm border border-border/40"
                      )}>
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content.replace(/\*\*(.*?)\*\*/g, (_, text) => `${text}`)}
                        </div>
                        
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant={action.variant || 'default'}
                                size="sm"
                                className="text-xs h-8 rounded-full hover:scale-105 transition-transform duration-200"
                                onClick={action.action}
                              >
                                {action.icon && <span className="mr-1">{action.icon}</span>}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className={cn(
                            "text-xs opacity-70",
                            message.sender === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {message.sender === 'ai' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-background/50 text-muted-foreground hover:text-primary"
                                onClick={() => copyMessage(message.content)}
                                title="Copy message"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-background/50 text-muted-foreground hover:text-green-500"
                                onClick={() => alert('Feedback received: Liked')}
                                title="Like"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-background/50 text-muted-foreground hover:text-red-500"
                                onClick={() => alert('Feedback received: Disliked')}
                                title="Dislike"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {message.sender === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Quick Actions as Accordion - Always visible */}
              <Accordion type="single" collapsible defaultValue="quick-questions" className="border-t">
                <AccordionItem value="quick-questions" className="border-b-0">
                  <AccordionTrigger className="px-6 py-3 bg-gradient-to-r from-muted/30 to-muted/10 hover:no-underline sticky bottom-[140px] z-10 backdrop-blur-sm">
                    <span className="text-sm font-medium">Quick questions</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-3 bg-gradient-to-r from-muted/20 to-muted/5">
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 rounded-full hover:scale-105 transition-transform duration-200 bg-background/50"
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>
            
            {/* Sticky Footer with Input */}
            <div className="sticky bottom-0 w-full bg-background/95 backdrop-blur-md shadow-md z-10">
              <div className="p-6 border-t bg-gradient-to-r from-background/80 to-background/60">
              <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Powered by AI • Always learning
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs hover:scale-105 transition-transform duration-200"
                    onClick={() => {
                      setMessages([messages[0]]);
                      setInputValue('');
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about FAM Portal..."
                      className="pr-14 h-12 rounded-full border-muted-foreground/20 focus:border-primary bg-background/80 backdrop-blur-sm shadow-sm"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
               
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
