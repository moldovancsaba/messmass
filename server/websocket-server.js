const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// WHAT: Configuration for WebSocket server performance and limits
// WHY: Prevent resource exhaustion and optimize memory usage
const port = process.env.PORT || 7654;
const MAX_CONNECTIONS = parseInt(process.env.MAX_WS_CONNECTIONS || '1000', 10);
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const STALE_CONNECTION_TIMEOUT = 60000; // 1 minute
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute

// WHAT: WebSocket server with perMessageDeflate compression
// WHY: Reduces bandwidth usage for real-time updates
const wss = new WebSocket.Server({ 
  port: port,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  },
  maxPayload: 100 * 1024, // 100KB max message size
  verifyClient: (info) => {
    // WHAT: Connection limit enforcement
    // WHY: Prevent DoS attacks and resource exhaustion
    if (clients.size >= MAX_CONNECTIONS) {
      console.warn(`⚠️  Connection limit reached (${MAX_CONNECTIONS}), rejecting new connection`);
      return false;
    }
    return true;
  }
});

// WHAT: Optimized data structures for client and room management
// WHY: Fast lookup and memory-efficient storage
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

// WHAT: Periodic cleanup of stale connections
// WHY: Prevent memory leaks from zombie connections
setInterval(() => {
  const now = Date.now();
  let staleCount = 0;

  clients.forEach((client, clientId) => {
    if (now - client.lastHeartbeat > STALE_CONNECTION_TIMEOUT) {
      console.log(`Removing stale client: ${clientId}`);
      client.ws.terminate();
      handleClientDisconnect(clientId);
      staleCount++;
    }
  });
  
  if (staleCount > 0) {
    console.log(`🧪 Cleaned up ${staleCount} stale connection(s)`);
  }
}, HEARTBEAT_INTERVAL);

// WHAT: Memory usage monitoring and statistics
// WHY: Track resource consumption and detect potential memory leaks
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const externalMB = (memUsage.external / 1024 / 1024).toFixed(2);
  
  console.log(`📊 Server Stats:`);
  console.log(`   Clients: ${clients.size} / ${MAX_CONNECTIONS}`);
  console.log(`   Rooms: ${projectRooms.size}`);
  console.log(`   Memory: ${heapUsedMB}MB / ${heapTotalMB}MB (heap), ${externalMB}MB (external)`);
  
  // WHAT: Warning when memory usage is high
  // WHY: Alert for potential memory leaks or need for optimization
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  if (heapUsagePercent > 85) {
    console.warn(`⚠️  High memory usage: ${heapUsagePercent.toFixed(1)}%`);
  }
}, MEMORY_CHECK_INTERVAL);

console.log(`🚀 WebSocket server running on port ${port}`);
console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔒 Max connections: ${MAX_CONNECTIONS}`);
console.log(`💓 Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);
console.log(`⏱️  Stale timeout: ${STALE_CONNECTION_TIMEOUT}ms`);
console.log(`💾 Compression enabled: perMessageDeflate`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
