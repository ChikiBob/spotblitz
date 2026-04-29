import { io } from 'socket.io-client';

// Backend URL — phones connect via LAN IP
// In production build, set VITE_BACKEND_URL in .env
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3005';

const socket = io(BACKEND, {
  autoConnect:          true,
  reconnection:         true,
  reconnectionDelay:    1000,
  reconnectionAttempts: 20,
});

export default socket;
export { BACKEND };
