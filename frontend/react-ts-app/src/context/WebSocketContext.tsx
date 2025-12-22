import { createContext, useContext, useEffect, useState, ReactNode } from 'react';


interface WebSocketProviderProps {
	children: ReactNode;
}

interface WebSocketContextType {
	ws: WebSocket | null;
	sessionId: string;
	isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
	ws: null,
	sessionId: '',
	isConnected: false
});

export function WebSocketProvider({ children }: WebSocketProviderProps) {
	const [ws, setWs] = useState<WebSocket | null>(null);
	const [sessionId, setSessionId] = useState<string>('');
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		console.log('Connecting to WebSocket...');
		const websocket = new WebSocket('ws://localhost:8081/ws');

		websocket.onopen = () => {
			console.log('✅ WebSocket connected');
			setIsConnected(true);
		};

		websocket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'connected') {
				setSessionId(data.sessionId);
				console.log('Session ID:', data.sessionId);
			}
		};

		websocket.onerror = (error) => {
			console.error('❌ WebSocket error:', error);
			setIsConnected(false);
		};

		websocket.onclose = () => {
			console.log('WebSocket disconnected');
			setIsConnected(false);
		};

		setWs(websocket);

		// Cleanup on unmount
		return () => {
			if (websocket.readyState === WebSocket.OPEN) {
				websocket.close();
			}
		};
	}, []);

	return (
		<WebSocketContext.Provider value={{ ws, sessionId, isConnected }}>
			{children}
		</WebSocketContext.Provider>
	);
}

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error('useWebSocket must be used within WebSocketProvider');
	}
	return context;
};
