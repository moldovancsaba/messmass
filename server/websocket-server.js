const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.WS_PORT || 8080;

// WebSocket server for real-time collaboration
const wss = new WebSocket.Server({ 
  port: PORT,
  clientTracking: true 
});

// Store active connections with metadata
const connections = new Map();

// Store room-based sessions (projectId -> Set of connectionIds)
const projectRooms = new Map();

// Store current project states for synchronization
const projectStates = new Map();

console.log(`🚀 WebSocket server started on port ${PORT}`);

wss.on('connection', (ws, req) => {
  const connectionId = uuidv4();
  const userInfo = {
    id: connectionId,
    connectedAt: new Date(),
    currentProject: null,
    ws: ws
  };
  
  connections.set(connectionId, userInfo);
  console.log(`👤 New connection: ${connectionId} (Total: ${connections.size})`);

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    connectionId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(connectionId, message);
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    const user = connections.get(connectionId);
    if (user && user.currentProject) {
      leaveProject(connectionId, user.currentProject);
    }
    connections.delete(connectionId);
    console.log(`👋 Connection closed: ${connectionId} (Total: ${connections.size})`);
  });

  // Handle connection errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${connectionId}:`, error);
  });
});

function handleMessage(connectionId, message) {
  const user = connections.get(connectionId);
  if (!user) return;

  console.log(`📨 Message from ${connectionId}:`, message.type);

  switch (message.type) {
    case 'join_project':
      joinProject(connectionId, message.projectId, message.projectData);
      break;
    
    case 'leave_project':
      if (user.currentProject) {
        leaveProject(connectionId, user.currentProject);
      }
      break;
    
    case 'stat_increment':
      handleStatIncrement(connectionId, message);
      break;
    
    case 'project_update':
      handleProjectUpdate(connectionId, message);
      break;
    
    case 'reset_stats':
      handleStatsReset(connectionId, message);
      break;
    
    default:
      user.ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${message.type}`
      }));
  }
}

function joinProject(connectionId, projectId, projectData = null) {
  const user = connections.get(connectionId);
  if (!user) return;

  // Leave current project if any
  if (user.currentProject) {
    leaveProject(connectionId, user.currentProject);
  }

  // Join new project
  user.currentProject = projectId;
  
  if (!projectRooms.has(projectId)) {
    projectRooms.set(projectId, new Set());
  }
  
  projectRooms.get(projectId).add(connectionId);

  // Initialize or update project state
  if (projectData && !projectStates.has(projectId)) {
    projectStates.set(projectId, {
      ...projectData,
      lastUpdated: new Date().toISOString(),
      activeUsers: 1
    });
  } else if (projectStates.has(projectId)) {
    const state = projectStates.get(projectId);
    state.activeUsers = projectRooms.get(projectId).size;
  }

  console.log(`🏠 User ${connectionId} joined project ${projectId}`);

  // Send current project state to the user
  const currentState = projectStates.get(projectId);
  user.ws.send(JSON.stringify({
    type: 'project_joined',
    projectId,
    projectState: currentState,
    activeUsers: projectRooms.get(projectId).size
  }));

  // Notify other users in the project
  broadcastToProject(projectId, {
    type: 'user_joined',
    projectId,
    activeUsers: projectRooms.get(projectId).size,
    timestamp: new Date().toISOString()
  }, connectionId);
}

function leaveProject(connectionId, projectId) {
  const user = connections.get(connectionId);
  if (!user) return;

  user.currentProject = null;
  
  if (projectRooms.has(projectId)) {
    projectRooms.get(projectId).delete(connectionId);
    
    // Update active users count
    if (projectStates.has(projectId)) {
      const state = projectStates.get(projectId);
      state.activeUsers = projectRooms.get(projectId).size;
    }

    // Clean up empty rooms
    if (projectRooms.get(projectId).size === 0) {
      projectRooms.delete(projectId);
      projectStates.delete(projectId);
      console.log(`🗑️ Cleaned up empty project room: ${projectId}`);
    } else {
      // Notify remaining users
      broadcastToProject(projectId, {
        type: 'user_left',
        projectId,
        activeUsers: projectRooms.get(projectId).size,
        timestamp: new Date().toISOString()
      });
    }
  }

  console.log(`🚪 User ${connectionId} left project ${projectId}`);
}

function handleStatIncrement(connectionId, message) {
  const user = connections.get(connectionId);
  if (!user || !user.currentProject) return;

  const { statKey, newValue } = message;
  const projectId = user.currentProject;

  // Update project state
  if (projectStates.has(projectId)) {
    const state = projectStates.get(projectId);
    if (state.stats && typeof state.stats[statKey] === 'number') {
      state.stats[statKey] = newValue;
      state.lastUpdated = new Date().toISOString();

      // Broadcast to all users in the project
      broadcastToProject(projectId, {
        type: 'stat_updated',
        projectId,
        statKey,
        newValue,
        updatedBy: connectionId,
        timestamp: state.lastUpdated
      });

      console.log(`📊 Stat updated: ${statKey} = ${newValue} in project ${projectId}`);
    }
  }
}

function handleProjectUpdate(connectionId, message) {
  const user = connections.get(connectionId);
  if (!user || !user.currentProject) return;

  const { eventName, eventDate, stats } = message;
  const projectId = user.currentProject;

  // Update project state
  if (projectStates.has(projectId)) {
    const state = projectStates.get(projectId);
    state.eventName = eventName;
    state.eventDate = eventDate;
    state.stats = stats;
    state.lastUpdated = new Date().toISOString();

    // Broadcast to all users in the project except sender
    broadcastToProject(projectId, {
      type: 'project_updated',
      projectId,
      eventName,
      eventDate,
      stats,
      updatedBy: connectionId,
      timestamp: state.lastUpdated
    }, connectionId);

    console.log(`📝 Project updated: ${eventName} in project ${projectId}`);
  }
}

function handleStatsReset(connectionId, message) {
  const user = connections.get(connectionId);
  if (!user || !user.currentProject) return;

  const { resetStats } = message;
  const projectId = user.currentProject;

  // Update project state
  if (projectStates.has(projectId)) {
    const state = projectStates.get(projectId);
    state.stats = resetStats;
    state.lastUpdated = new Date().toISOString();

    // Broadcast to all users in the project
    broadcastToProject(projectId, {
      type: 'stats_reset',
      projectId,
      stats: resetStats,
      resetBy: connectionId,
      timestamp: state.lastUpdated
    });

    console.log(`🔄 Stats reset in project ${projectId}`);
  }
}

function broadcastToProject(projectId, message, excludeConnectionId = null) {
  if (!projectRooms.has(projectId)) return;

  const room = projectRooms.get(projectId);
  const messageStr = JSON.stringify(message);

  room.forEach(connectionId => {
    if (connectionId === excludeConnectionId) return;
    
    const user = connections.get(connectionId);
    if (user && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
}

// Heartbeat to keep connections alive
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeat);
});

// Handle ping/pong for connection health
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down WebSocket server...');
  wss.close();
  process.exit(0);
});