import { spawn } from "node:child_process";
import { createMockApiServer, MOCK_ACCOUNTS, MOCK_PASSWORD } from "./mock-api.mjs";

const api = createMockApiServer();
api.on("error", (error) => {
  console.error("Không khởi động được API mock:", error.message);
  process.exitCode = 1;
});
api.listen(0, "127.0.0.1", () => {
  const port = api.address().port;
  console.log("\nGuardianWork · API mock (dữ liệu lưu trong RAM, khởi động lại để đặt lại).");
  console.table(
    MOCK_ACCOUNTS.map(({ username, email, role }) => ({
      username,
      email,
      role,
      password: MOCK_PASSWORD,
    })),
  );
  console.log("Frontend: http://localhost:5137 · Dữ liệu mẫu: README.md\n");
  const vite = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "5137",
      "--strictPort",
      "--mode",
      "mock",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        VITE_API_BASE_URL: "/api",
        VITE_API_PROXY_TARGET: `http://127.0.0.1:${port}`,
      },
    },
  );
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    vite.kill("SIGTERM");
    api.close();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  vite.on("error", (error) => {
    console.error(error.message);
    api.close();
    process.exitCode = 1;
  });
  vite.on("exit", (code) => {
    api.close();
    process.exitCode = code ?? 0;
  });
});
