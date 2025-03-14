import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  Button,
  Divider,
  Grid
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/message/recent-conversations');
        setConversations(response.data);
      } catch (err) {
        setError('Failed to load conversations');
      }
    };

    fetchConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        const response = await api.get(`/message/conversation/${selectedUser}`);
        setMessages(response.data);
      } catch (err) {
        setError('Failed to load messages');
      }
    };

    if (selectedUser) {
      fetchMessages();
      // Poll for new messages every 5 seconds when in a conversation
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    try {
      const response = await api.post('/message', {
        receiverId: selectedUser,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
      {/* Conversations List */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Conversations
          </Typography>
          <List>
            {conversations.map((conv) => (
              <ListItem
                key={conv.userId}
                button
                selected={selectedUser === conv.userId}
                onClick={() => setSelectedUser(conv.userId)}
              >
                <ListItemAvatar>
                  <Avatar>{conv.username[0].toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={conv.username}
                  secondary={conv.lastMessage}
                  secondaryTypographyProps={{
                    noWrap: true,
                    style: { width: '200px' }
                  }}
                />
                {conv.unreadCount > 0 && (
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      minWidth: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ml: 1
                    }}
                  >
                    {conv.unreadCount}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Messages */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.senderId === user?.userId ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: message.senderId === user?.userId ? 'primary.main' : 'grey.200',
                        color: message.senderId === user?.userId ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography color="text.secondary">
                Select a conversation to start messaging
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Grid>
  );
};

export default Messages;
