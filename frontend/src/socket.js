import { io } from 'socket.io-client';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3005';

const socket = io(BACKEND, {
  autoConnect:       true,
  reconnection:      true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

export default socket;
export { BACKEND };
