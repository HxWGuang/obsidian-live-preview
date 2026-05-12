import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { getReloadScript } from "./inject-script";

const STATIC_EXTENSIONS = new Set([
  ".html", ".htm", ".css", ".js", ".svg", ".png", ".jpg",
  ".jpeg", ".webp", ".gif", ".ico", ".json", ".xml", ".txt",
  ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".webm",
]);

const MIME_MAP: Record<string, string> = {
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function injectReload(html: string, port: number): string {
  const script = getReloadScript(port);
  if (html.includes("</body>")) {
    return html.replace("</body>", script + "</body>");
  }
  if (html.includes("</BODY>")) {
    return html.replace("</BODY>", script + "</BODY>");
  }
  return html + script;
}

export class LiveServer {
  port: number;
  isRunning = false;

  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private rootDir = "";
  private clients = new Set<WebSocket>();

  constructor(startPort: number) {
    this.port = startPort;
  }

  async start(rootDir: string): Promise<void> {
    if (this.isRunning) {
      this.setRootDir(rootDir);
      return;
    }
    this.rootDir = path.resolve(rootDir);

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.wss = new WebSocketServer({ noServer: true });

    this.server.on("upgrade", (req, socket, head) => {
      if (req.url === "/live-reload") {
        this.wss!.handleUpgrade(req, socket, head, (ws) => {
          this.clients.add(ws);
          ws.on("close", () => this.clients.delete(ws));
        });
      } else {
        socket.destroy();
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.listen(this.port, resolve, reject);
    });

    this.isRunning = true;
  }

  private listen(p: number, resolve: () => void, reject: (err: Error) => void): void {
    this.server!.listen(p, "127.0.0.1", () => {
      this.port = p;
      resolve();
    });
    this.server!.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        this.server!.close();
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        this.server.on("upgrade", (_req, socket, head) => {
          if (_req.url === "/live-reload") {
            this.wss!.handleUpgrade(_req, socket, head, (ws) => {
              this.clients.add(ws);
              ws.on("close", () => this.clients.delete(ws));
            });
          } else {
            socket.destroy();
          }
        });
        this.listen(p + 1, resolve, reject);
      } else {
        reject(err);
      }
    });
  }

  async stop(): Promise<void> {
    for (const ws of this.clients) {
      ws.close();
    }
    this.clients.clear();
    this.wss?.close();
    return new Promise<void>((resolve) => {
      this.server?.close(() => {
        this.server = null;
        this.wss = null;
        this.isRunning = false;
        resolve();
      });
    });
  }

  setRootDir(dir: string): void {
    this.rootDir = path.resolve(dir);
  }

  sendReload(): void {
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("reload");
      }
    }
  }

  getUrl(filePath: string): string {
    const relative = path.relative(this.rootDir, filePath);
    return `http://localhost:${this.port}/${relative}`;
  }

  private handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }

    const urlPath = decodeURIComponent(req.url || "/");
    const normalized = path.normalize(urlPath);
    const safePath = path.join(this.rootDir, normalized);

    // Block directory traversal
    if (!safePath.startsWith(this.rootDir + path.sep) && safePath !== this.rootDir) {
      res.writeHead(403);
      res.end();
      return;
    }

    // Block directory access
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      res.writeHead(403);
      res.end();
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    if (!STATIC_EXTENSIONS.has(ext)) {
      res.writeHead(403);
      res.end();
      return;
    }

    try {
      const content = fs.readFileSync(safePath);
      const mimeType = MIME_MAP[ext] || "application/octet-stream";
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (ext === ".html" || ext === ".htm") {
        const html = injectReload(content.toString("utf-8"), this.port);
        res.end(html);
      } else {
        res.end(content);
      }
    } catch {
      res.writeHead(500);
      res.end();
    }
  }
}
