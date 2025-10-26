import { useState, useRef, useEffect } from 'react';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import { Box, Sheet, Textarea, IconButton, Typography, Card, Button, Chip } from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import BuildIcon from '@mui/icons-material/Build';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Logo from './assets/Logo';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#bdbdbd',
          300: '#9e9e9e',
          400: '#757575',
          500: '#1a1a1a',
          600: '#141414',
          700: '#0f0f0f',
          800: '#0a0a0a',
          900: '#000000',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
});

// Generate unique thread ID
const generateThreadId = () => {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Welcome Screen Component
function WelcomeScreen() {
  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
        px: 3,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Logo width="120px" height="120px" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Typography 
          level="h1" 
          sx={{ 
            color: 'neutral.900',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          SevaHealth AI
        </Typography>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Typography 
          level="h4" 
          sx={{ 
            color: 'neutral.700',
            textAlign: 'center',
            fontWeight: 500,
            maxWidth: '600px'
          }}
        >
          AI Chatbot for Health Access
        </Typography>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <Typography 
          level="body-lg" 
          sx={{ 
            color: 'neutral.600',
            textAlign: 'center',
            maxWidth: '600px'
          }}
        >
          Know hospitals and care details
        </Typography>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <Card
          variant="soft"
          sx={{
            maxWidth: '500px',
            bgcolor: 'neutral.100',
            border: '1px solid',
            borderColor: 'neutral.200',
          }}
        >
          <Typography 
            level="body-sm" 
            sx={{ 
              color: 'neutral.600',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}
          >
            ⚠️ AI Response Disclaimer: This chatbot provides general health information and should not replace professional medical advice. Always consult with qualified healthcare providers for medical concerns.
          </Typography>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <Typography 
          level="body-sm" 
          sx={{ 
            color: 'neutral.500',
            textAlign: 'center',
            fontStyle: 'italic'
          }}
        >
          Type a message below to get started
        </Typography>
      </motion.div>
    </Box>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    console.log("Messages updated:", messages);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isStreaming) return;

    // Generate thread_id on first message
    const currentThreadId = threadId || generateThreadId();
    if (!threadId) {
      setThreadId(currentThreadId);
    }

    // Hide welcome screen when first message is sent
    if (showWelcome) {
      setShowWelcome(false);
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = inputValue.trim();
    setInputValue('');
    setIsStreaming(true);

    // Create a placeholder for assistant message
    const assistantMessageId = Date.now() + 1;
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Use fetch with POST for SSE
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          thread_id: currentThreadId,
          user_query: userQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        // Each SSE event is guaranteed to be: data: <json>\n\n
        const events = buffer.split(/\n\n/);
        // Retain incomplete chunk in buffer
        buffer = events.pop() || "";
        
        events.forEach((evtChunk) => {
          const match = evtChunk.match(/^data:\s*(.*)$/ms);
          if (match && match[1]) {
            try {
              const data = JSON.parse(match[1]);
              console.log("Parsed SSE Data:", data);
              const message = data.message;
              console.log("Message object:", message);

              if (!message) return;

              // Handle different message types
              if (message.node === 'chatbot') {
                const messageData = message.message;
                console.log("Chatbot message data:", messageData);
                
                if (messageData.type === 'tool') {
                  console.log("Tool call detected, full messageData:", messageData);
                  const toolName = messageData.data?.name || messageData.name;
                  console.log("Tool name:", toolName);
                  // Show tool call
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            toolCalls: [
                              ...(msg.toolCalls || []),
                              { name: toolName, type: 'tool' },
                            ],
                          }
                        : msg
                    )
                  );
                } else if (messageData.type === 'ai') {
                  console.log("AI message detected, full messageData:", messageData);
                  // Handle AI response - the content is in messageData.data.content
                  const content = messageData.data?.content || messageData.content;
                  console.log("Extracted content:", content);
                  
                  if (typeof content === 'string') {
                    accumulatedContent = content;
                  } else if (Array.isArray(content)) {
                    // Handle array content
                    const textContent = content
                      .filter((item) => item.type === 'text')
                      .map((item) => item.text)
                      .join('');
                    accumulatedContent = textContent;
                  }

                  console.log("Setting accumulated content:", accumulatedContent);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              } else if (message.node === 'tool_call') {
                const messageData = message.message;
                console.log("Tool call response, full messageData:", messageData);
                
                // Show tool response
                const toolName = messageData.data?.name || messageData.name;
                if (toolName) {
                  console.log("Adding tool response:", toolName);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            toolCalls: [
                              ...(msg.toolCalls || []),
                              { name: toolName, type: 'tool_response' },
                            ],
                          }
                        : msg
                    )
                  );
                }
              }
            } catch (err) {
              console.warn("Failed to parse SSE event JSON", err, match[1]);
            }
          }
        });
      }
      
      // Flush remaining buffer
      const match = buffer.match(/^data:\s*(.*)$/ms);
      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);
          const message = data.message;

          if (message) {
            // Handle any final message in buffer
            if (message.node === 'chatbot') {
              const messageData = message.message;
              
              if (messageData.type === 'ai') {
                const content = messageData.data?.content || messageData.content;
                
                if (typeof content === 'string') {
                  accumulatedContent = content;
                } else if (Array.isArray(content)) {
                  const textContent = content
                    .filter((item) => item.type === 'text')
                    .map((item) => item.text)
                    .join('');
                  accumulatedContent = textContent;
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
            }
          }
        } catch (err) {
          console.warn("Failed to parse SSE event JSON", err, match[1]);
        }
      }

      // Mark streaming as complete
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your request.',
                isStreaming: false,
              }
            : msg
        )
      );
    }
  };

  const handleNewChat = () => {
    // Reset state
    setMessages([]);
    setThreadId(null);
    setInputValue('');
    setIsStreaming(false);
    setShowWelcome(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <CssVarsProvider theme={theme}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'neutral.50',
        }}
      >
        {/* Header */}
        <Sheet
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'neutral.200',
            bgcolor: 'background.surface',
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography level="h4" sx={{ color: 'neutral.900' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Logo width="40px" height="40px" />
              SevaHealth AI
            </Box>
          </Typography>
          <Button onClick={handleNewChat} variant="outlined" color="neutral">
            New Chat
          </Button>
        </Sheet>

        {/* Chat Messages Container */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {showWelcome ? (
            <WelcomeScreen />
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.role === 'user' ? (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Card
                        sx={{
                          maxWidth: '70%',
                          bgcolor: 'neutral.200',
                          p: 2,
                          borderRadius: 'lg',
                        }}
                      >
                        <Typography sx={{ color: 'neutral.900' }}>
                          {message.content}
                        </Typography>
                      </Card>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', gap: 1 }}>
                      {/* Tool calls display */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {message.toolCalls.map((tool, index) => (
                            <Chip
                              key={index}
                              startDecorator={<BuildIcon />}
                              variant="soft"
                              color="primary"
                              size="sm"
                            >
                              {tool.name}
                            </Chip>
                          ))}
                        </Box>
                      )}
                      
                      {/* Message content */}
                      <Card
                        variant="plain"
                        sx={{
                          maxWidth: '70%',
                          bgcolor: 'transparent',
                          p: 2,
                          border: 'none',
                          boxShadow: 'none',
                        }}
                      >
                        {message.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ node, ...props }) => (
                                <Typography level="h2" sx={{ mb: 1, mt: 2 }} {...props} />
                              ),
                              h2: ({ node, ...props }) => (
                                <Typography level="h3" sx={{ mb: 1, mt: 2 }} {...props} />
                              ),
                              h3: ({ node, ...props }) => (
                                <Typography level="h4" sx={{ mb: 1, mt: 1 }} {...props} />
                              ),
                              p: ({ node, ...props }) => (
                                <Typography sx={{ mb: 1, color: 'neutral.800' }} {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <Box component="ul" sx={{ pl: 3, mb: 1 }} {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <Box component="ol" sx={{ pl: 3, mb: 1 }} {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <Typography component="li" sx={{ mb: 0.5 }} {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <Typography component="strong" sx={{ fontWeight: 'bold' }} {...props} />
                              ),
                              blockquote: ({ node, ...props }) => (
                                <Box
                                  component="blockquote"
                                  sx={{
                                    borderLeft: '4px solid',
                                    borderColor: 'neutral.300',
                                    pl: 2,
                                    py: 1,
                                    my: 1,
                                    fontStyle: 'italic',
                                    color: 'neutral.700',
                                  }}
                                  {...props}
                                />
                              ),
                              code: ({ node, inline, ...props }) =>
                                inline ? (
                                  <Typography
                                    component="code"
                                    sx={{
                                      bgcolor: 'neutral.100',
                                      px: 0.5,
                                      py: 0.25,
                                      borderRadius: 'sm',
                                      fontSize: '0.875em',
                                      fontFamily: 'monospace',
                                    }}
                                    {...props}
                                  />
                                ) : (
                                  <Box
                                    component="pre"
                                    sx={{
                                      bgcolor: 'neutral.100',
                                      p: 2,
                                      borderRadius: 'sm',
                                      overflowX: 'auto',
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      component="code"
                                      sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.875em',
                                      }}
                                      {...props}
                                    />
                                  </Box>
                                ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : null}
                      </Card>
                    </Box>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Box>

        {/* Input Area */}
        <Sheet
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'neutral.200',
            bgcolor: 'background.surface',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Textarea
              minRows={3}
              maxRows={6}
              placeholder="Type your message... (Shift+Enter for new line)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              sx={{
                flex: 1,
                bgcolor: 'background.body',
                opacity: isStreaming ? 0.6 : 1,
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={inputValue.trim() === '' || isStreaming}
              sx={{
                bgcolor: 'neutral.900',
                color: 'white',
                '&:hover': {
                  bgcolor: 'neutral.800',
                },
                '&:disabled': {
                  bgcolor: 'neutral.300',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          {isStreaming && (
            <Typography 
              level="body-xs" 
              sx={{ 
                mt: 1, 
                color: 'neutral.500',
                textAlign: 'center' 
              }}
            >
              AI is responding...
            </Typography>
          )}
        </Sheet>
      </Box>
    </CssVarsProvider>
  );
}

export default App;
