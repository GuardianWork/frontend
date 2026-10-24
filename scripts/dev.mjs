import { spawn } from "node:child_process";

const children = new Set();
let stopping = false;
let killTimer;

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) child.kill("SIGTERM");
  killTimer = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
  }, 5000);
  killTimer.unref();
}

process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));

for (const mode of ["development", "staff"]) {
  const child = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "dev", "--mode", mode, ...process.argv.slice(2)],
    { stdio: "inherit", env: process.env },
  );
  children.add(child);
  child.on("error", (error) => {
    console.error(`Không khởi động được frontend ${mode}:`, error.message);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    children.delete(child);
    if (!stopping) {
      console.error(`Frontend ${mode} đã dừng (${signal ?? code}); đang dừng cả hai server.`);
      stop(code || 1);
    }
    if (children.size === 0) clearTimeout(killTimer);
  });
}
