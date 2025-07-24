import { io, Socket } from "socket.io-client";

export const socket: Socket = io("https://veil-1qpe.onrender.com", {
  transports: ["websocket"],
});
