const { createServer } = require("http")
const next = require("next")
const { initializeSocketServer } = require("./fly.io/lib/socket-server")

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "localhost" : undefined;
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req: any, res: any) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

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
});
