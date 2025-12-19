const { createServer } = require("http")
const { initializeSocketServer } = require("./lib/socket-server")

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : undefined;
const port = process.env.PORT || 3000;


const httpServer = createServer(async (req: any, res: any) => { });

// Initialize Socket.IO
initializeSocketServer(httpServer);

// Start HTTP server with error handling
httpServer
  .once("error", (err: any) => {
    console.error("HTTP Server Error:", err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

