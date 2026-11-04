import { createServer, type AddressInfo, type Server } from "node:net";

function isTcpAddress(
  address: ReturnType<Server["address"]>,
): address is AddressInfo {
  return typeof address === "object" && address !== null;
}

/** A TCP port on `127.0.0.1` that nothing listens on right now. */
export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!isTcpAddress(address)) {
        server.close(() => reject(new Error("The server has no TCP port")));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}
