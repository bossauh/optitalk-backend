import { io } from "socket.io-client";

let socket = io("http://127.0.0.1:5000");
if (process.env.NODE_ENV === "production") {
  socket = io();
}

export default socket;
