import app from "./app";
import http from "http";

const port = process.env.PORT || "3000";
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
console.log(`Express server currently running on port ${port}`);

export default server;
