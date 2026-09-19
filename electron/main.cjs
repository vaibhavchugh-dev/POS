const { app, BrowserWindow, Menu } = require("electron");

app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu-sandbox");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const PORT = Number(process.env.POS_PORT || 43123);
const HOST = "127.0.0.1";
const ROOT = path.join(__dirname, "..");

let nextProcess = null;
let mainWindow = null;

function waitForHttp(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("POS server did not start in time."));
          return;
        }
        setTimeout(attempt, 400);
      });
    };
    attempt();
  });
}

function nextCommand() {
  const bin = path.join(
    ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "next.cmd" : "next",
  );
  const built = fs.existsSync(path.join(ROOT, ".next"));
  const args = [
    built && !process.env.POS_DEV ? "start" : "dev",
    "--hostname",
    HOST,
    "--port",
    String(PORT),
  ];
  return { bin, args };
}

function startLocalServer() {
  const { bin, args } = nextCommand();
  nextProcess = spawn(bin, args, {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: "inherit",
    shell: process.platform === "win32",
    windowsHide: true,
  });
  nextProcess.on("exit", (code) => {
    if (code && code !== 0 && mainWindow) {
      console.error("POS server exited", code);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Jain Dosa House POS",
    backgroundColor: "#f4ead8",
    autoHideMenuBar: true,
    backgroundColor: "#fafafa",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(`http://${HOST}:${PORT}`);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const url = `http://${HOST}:${PORT}`;
  try {
    await waitForHttp(url, 1500);
  } catch {
    startLocalServer();
    await waitForHttp(url);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill();
  }
  app.quit();
});
