import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://app.remedius.ai';

// Socket instance
let socket: Socket | null = null;

/**
 * Initialize and connect socket with user authentication
 * @param userId - The logged-in user's ID
 */
export const connectSocket = (userId: string) => {
    if (!userId) {
        console.error('[Socket] UserId is required for socket connection');
        return;
    }

    // Disconnect existing socket if any
    if (socket?.connected) {
        console.log('[Socket] Disconnecting existing socket');
        socket.disconnect();
    }

    // Create new socket instance with authentication
    socket = io(SOCKET_URL, {
        autoConnect: false,
        path: '/socket.io/',
        auth: {
            userId,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
    });

    // Setup connection event listeners
    socket.on('connect', () => {
        console.log('[Socket] ✅ Connected successfully!');
        console.log('[Socket] Socket ID:', socket?.id);
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] ❌ Connection error:', error.message);
        console.error('[Socket] Error details:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected. Reason:', reason);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('[Socket] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('error', (error) => {
        console.error('[Socket] Socket error:', error);
    });

    // Connect the socket
    socket.connect();

    return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
    if (socket) {
        console.log('[Socket] Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
};

/**
 * Get the current socket instance
 */
export const getSocket = (): Socket | null => {
    return socket;
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
    return socket?.connected || false;
};

export { socket };
