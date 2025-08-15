// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

class RealTimeCollaborationServer {
  constructor(port = 3001) {
    this.port = port;
    this.wss = null;
    this.mongoClient = null;
    this.projectSessions = new Map();
    this.userSessions = new Map();
    
    this.mongoUri = process.env.MONGODB_URI;
    if (!this.mongoUri) {
      console.error('❌ MONGODB_URI environment variable is required');
      console.error('❌ Make sure .env.local exists with your MongoDB Atlas connection string');
      process.exit(1);
    }
    
    this.init();
  }
  
  async init() {
    try {
      this.mongoClient = new MongoClient(this.mongoUri);
      await this.mongoClient.connect();
      console.log('✅ Connected to MongoDB Atlas');
      
      this.wss = new WebSocket.Server({ port: this.port });
      
      this.wss.on('connection', (ws) => {
        console.log('🔌 New WebSocket connection');
        
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
        
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleMessage(ws, message);
          } catch (error) {
            console.error('❌ Error handling message:', error);
          }
        });
        
        ws.on('close', () => {
          this.handleUserDisconnect(ws);
        });
      });
      
      // Heartbeat to detect broken connections
      setInterval(() => {
        this.wss.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            this.handleUserDisconnect(ws);
            return ws.terminate();
          }
          
          ws.isAlive = false;
          ws.ping();
        });
      }, 30000);
      
      console.log(`🚀 WebSocket server running on port ${this.port}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize server:', error);
      process.exit(1);
    }
  }
  
  async handleMessage(ws, message) {
    switch (message.type) {
      case 'join_project':
        await this.handleJoinProject(ws, message);
        break;
      case 'update_statistic':
        await this.handleStatisticUpdate(ws, message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  async handleJoinProject(ws, message) {
    const { projectSlug, user } = message;
    
    ws.userId = user.id;
    ws.projectSlug = projectSlug;
    
    this.broadcastToProject(projectSlug, {
      type: 'user_joined',
      user
    }, user.id);
    
    ws.send(JSON.stringify({
      type: 'project_joined',
      success: true
    }));
    
    console.log(`👤 User ${user.name || user.id} joined project ${projectSlug}`);
  }
  
  async handleStatisticUpdate(ws, message) {
    const { statisticId, value, projectSlug } = message;
    
    try {
      const db = this.mongoClient.db('messmass');
      const collection = db.collection('projects');
      
      await collection.updateOne(
        { slug: projectSlug },
        {
          $set: {
            [`statistics.${statisticId}`]: value,
            lastModified: new Date().toISOString()
          }
        }
      );
      
      this.broadcastToProject(projectSlug, {
        type: 'statistic_updated',
        data: { statisticId, value, userId: ws.userId }
      }, ws.userId);
      
      console.log(`📊 Statistic ${statisticId} updated to ${value} in project ${projectSlug}`);
      
    } catch (error) {
      console.error('Error updating statistic:', error);
    }
  }
  
  handleUserDisconnect(ws) {
    if (ws.projectSlug && ws.userId) {
      this.broadcastToProject(ws.projectSlug, {
        type: 'user_left',
        userId: ws.userId
      }, ws.userId);
      
      console.log(`👋 User ${ws.userId} left project ${ws.projectSlug}`);
    }
  }
  
  broadcastToProject(projectSlug, message, excludeUserId = null) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && 
          client.projectSlug === projectSlug && 
          client.userId !== excludeUserId) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

const server = new RealTimeCollaborationServer(process.env.WS_PORT || 3001);

process.on('SIGINT', () => {
  console.log('🛑 Shutting down WebSocket server...');
  process.exit(0);
});
