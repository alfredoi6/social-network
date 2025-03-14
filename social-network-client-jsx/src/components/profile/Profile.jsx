import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Avatar,
  Box,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [pendingConnections, setPendingConnections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConnections();
    fetchPendingConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await api.get('/user/connections');
      setConnections(response.data);
    } catch (err) {
      setError('Failed to load connections');
    }
  };

  const fetchPendingConnections = async () => {
    try {
      const response = await api.get('/user/connections/pending');
      setPendingConnections(response.data);
    } catch (err) {
      setError('Failed to load pending connections');
    }
  };

  const handleAcceptConnection = async (connectionId) => {
    try {
      await api.put(`/user/connect/${connectionId}/accept`);
      fetchConnections();
      fetchPendingConnections();
    } catch (err) {
      setError('Failed to accept connection');
    }
  };

  const handleRejectConnection = async (connectionId) => {
    try {
      await api.put(`/user/connect/${connectionId}/reject`);
      fetchPendingConnections();
    } catch (err) {
      setError('Failed to reject connection');
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Profile Information */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              margin: '0 auto 16px',
              bgcolor: 'primary.main'
            }}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user?.username}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {user?.email}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              {connections.length} Connection{connections.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Connections and Requests */}
      <Grid item xs={12} md={8}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Pending Connection Requests */}
        {pendingConnections.length > 0 && (
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pending Requests
            </Typography>
            <List>
              {pendingConnections.map((connection) => (
                <ListItem key={connection.id}>
                  <ListItemAvatar>
                    <Avatar src={connection.profilePicture}>
                      {connection.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={connection.username}
                    secondary={connection.email}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      color="primary"
                      onClick={() => handleAcceptConnection(connection.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleRejectConnection(connection.id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Connections List */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Your Connections
          </Typography>
          {connections.length > 0 ? (
            <List>
              {connections.map((connection) => (
                <React.Fragment key={connection.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={connection.profilePicture}>
                        {connection.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={connection.username}
                      secondary={connection.email}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href="/messages"
                      >
                        Message
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              You haven't connected with anyone yet.
              Try searching for users to connect with!
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Profile;
