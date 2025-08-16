const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Use Railway's PORT or fallback to 7654
const port = process.env.PORT || 7654;

const wss = new WebSocket.Server({ 
  port: port,
  verifyClient: (info) => {
    // Allow all origins in production (you can restrict this)
    return true;
  }
});

const clients = new Map();
const projectRooms = new Map();

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  const clientInfo = {
    id: clientId,
    ws: ws,
    projectId: null,
    lastHeartbeat: Date.now()
  };
  
  clients.set(clientId, clientInfo);
  console.log(`Client connected: ${clientId} (Total: ${clients.size})`);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    timestamp: Date.now()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join-project':
          handleJoinProject(clientId, data.projectId);
          break;
        case 'stat-update':
          handleStatUpdate(clientId, data);
          break;
        case 'heartbeat':
          handleHeartbeat(clientId);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    handleClientDisconnect(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleClientDisconnect(clientId);
  });
});

function handleJoinProject(clientId, projectId) {
  const client = clients.get(clientId);
  if (!client) return;

  // Leave previous project room
  if (client.projectId) {
    leaveProjectRoom(clientId, client.projectId);
  }

  // Join new project room
  client.projectId = projectId;
  
  if (!projectRooms.has(projectId)) {
    projectRooms.set(projectId, new Set());
  }
  
  projectRooms.get(projectId).add(clientId);

  // Notify client of successful join
  client.ws.send(JSON.stringify({
    type: 'project-joined',
    projectId: projectId,
    usersInRoom: projectRooms.get(projectId).size,
    timestamp: Date.now()
  }));

  // Notify other users in the room
  broadcastToRoom(projectId, {
    type: 'user-joined',
    usersInRoom: projectRooms.get(projectId).size,
    timestamp: Date.now()
  }, clientId);
}

function handleStatUpdate(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.projectId) return;

  // Broadcast stat update to all other users in the same project room
  broadcastToRoom(client.projectId, {
    type: 'stat-updated',
    field: data.field,
    value: data.value,
    projectId: client.projectId,
    timestamp: Date.now()
  }, clientId);
}

function handleHeartbeat(clientId) {
  const client = clients.get(clientId);
  if (client) {
    client.lastHeartbeat = Date.now();
    client.ws.send(JSON.stringify({
      type: 'heartbeat-ack',
      timestamp: Date.now()
    }));
  }
}

function broadcastToRoom(projectId, message, excludeClientId = null) {
  const room = projectRooms.get(projectId);
  if (!room) return;

  room.forEach(clientId => {
    if (clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function leaveProjectRoom(clientId, projectId) {
  const room = projectRooms.get(projectId);
  if (room) {
    room.delete(clientId);
    
    // Notify remaining users
    broadcastToRoom(projectId, {
      type: 'user-left',
      usersInRoom: room.size,
      timestamp: Date.now()
    });
    
    // Clean up empty rooms
    if (room.size === 0) {
      projectRooms.delete(projectId);
    }
  }
}

function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (client) {
    if (client.projectId) {
      leaveProjectRoom(clientId, client.projectId);
    }
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId} (Total: ${clients.size})`);
  }
}

// Clean up stale connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  const staleTimeout = 60000; // 1 minute

  clients.forEach((client, clientId) => {
    if (now - client.lastHeartbeat > staleTimeout) {
      console.log(`Removing stale client: ${clientId}`);
      client.ws.terminate();
      handleClientDisconnect(clientId);
    }
  });
}, 30000);

console.log(`🚀 WebSocket server running on port ${port}`);
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
