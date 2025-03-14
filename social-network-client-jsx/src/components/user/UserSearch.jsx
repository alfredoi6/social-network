import { useState } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Paper,
  Box,
  Typography
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const response = await api.get(`/user/search?searchTerm=${encodeURIComponent(searchTerm)}`);
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to search users');
      setUsers([]);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await api.post('/user/connect', { receiverId: userId });
      // Refresh the search results to update connection status
      handleSearch();
    } catch (err) {
      setError('Failed to send connection request');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Find Users
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by username or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <List>
        {users.map((user) => (
          <ListItem
            key={user.id}
            secondaryAction={
              !user.isConnected && (
                <Button
                  variant="outlined"
                  startIcon={user.connectionStatus === 'Pending' ? <CheckIcon /> : <PersonAddIcon />}
                  onClick={() => handleConnect(user.id)}
                  disabled={user.connectionStatus === 'Pending'}
                >
                  {user.connectionStatus === 'Pending' ? 'Pending' : 'Connect'}
                </Button>
              )
            }
          >
            <ListItemAvatar>
              <Avatar src={user.profilePicture}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.username}
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {user.email}
                  </Typography>
                  {user.isConnected && (
                    <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
                      • Connected
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>

      {users.length === 0 && searchTerm && (
        <Typography color="text.secondary" align="center">
          No users found
        </Typography>
      )}
    </Paper>
  );
};

export default UserSearch;
