import { io } from "socket.io-client";

const socket = io(process.env.NODE_ENV === "development" ? "http://127.0.0.1:5000" : "https://optitalk.net");

export default socket;
