import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  log('📦 Step 1: Creating Vite server options...');
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  log('📦 Step 2: Initializing Vite server (this may take a moment)...');
  
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger, // Use default logger without modifications
    server: serverOptions,
    appType: "custom",
  });

  log('📦 Step 3: Vite server created, installing middleware...');
  
  app.use(vite.middlewares);
  
  log('📦 Step 4: Setting up catch-all route handler...');
  
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Use path.resolve with process.cwd() for reliability
      const projectRoot = process.cwd();
      const clientTemplate = path.resolve(projectRoot, "client", "index.html");

      log(`📄 Loading template from: ${clientTemplate}`);

      // Check if file exists
      if (!fs.existsSync(clientTemplate)) {
        throw new Error(`Template not found: ${clientTemplate}`);
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      const error = e as Error;
      log(`❌ Error serving page: ${error.message}`);
      console.error(error);
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

export function serveStatic(app: Express) {
  // Build output is in dist/public from project root
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
