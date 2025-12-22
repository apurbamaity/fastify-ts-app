// src/plugins/ws.plugin.ts
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import websocket from '@fastify/websocket';
import fp from "fastify-plugin";

const wsConnections = new Map<string, WebSocket>();

const wsPlugin = async (app: FastifyInstance) => {
	// Register @fastify/websocket
	await app.register(websocket);

	// WebSocket endpoint
	app.get('/ws', { websocket: true }, (socket, req) => {
		console.log('WebSocket client connected');

		// Generate unique session ID
		const sessionId = Math.random().toString(36).substring(7);
		wsConnections.set(sessionId, socket);

		// Send session ID to client
		socket.send(JSON.stringify({ type: 'connected', sessionId }));


		socket.on('message', (message: any) => {
			console.log('Client message:', message.toString());
		});

		socket.on('close', () => {
			console.log('WebSocket client disconnected');
			wsConnections.delete(sessionId);
		});
		wsConnections.forEach((socket, sessionId) => {
			console.log('connected sessionId ===>', sessionId);
		});
	});
};

// Send progress to a specific user (by sessionId)
export function sendProgressToUser(sessionId: string, data: any) {
	const socket = wsConnections.get(sessionId);
	if (socket) {
		socket.send(JSON.stringify(data));
	}
}

// Broadcast to all users (optional)
export function broadcastProgress(data: any) {
	const message = JSON.stringify(data);
	wsConnections.forEach(socket => {
		socket.send(message);
	});
}

export default fp(wsPlugin);