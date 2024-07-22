/* eslint-disable no-console */

import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { identify } from "@libp2p/identify";
import { tls } from "@libp2p/tls";
import { tcp } from "@libp2p/tcp";
import { MemoryBlockstore } from "blockstore-core";
import { MemoryDatastore } from "datastore-core";
import { createHelia } from "helia";
import { createLibp2p } from "libp2p";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import * as filters from "@libp2p/websockets/filters";
import express from "express";
import { peerIdFromKeys } from "@libp2p/peer-id";
import fs from "fs";

let peers: String[] = [];
const domainName = process.env.DOMAIN_NAME || "acidpictures.ink";

const app = express();
const port = 8080; // Port number for the Express server

const getPeerId = async () => {
  const peerIdJson = fs.readFileSync("./peer.json", "utf-8");
  const peerId = JSON.parse(peerIdJson);
  return peerIdFromKeys(
    Buffer.from(peerId.publicKey, "base64"),
    Buffer.from(peerId.privateKey, "base64")
  );
};

app.get("/peers", (req, res) => {
  res.json(peers);
});

function updatePeerList(libp2p) {
  // Update connections list
  const peerList = libp2p.getPeers().map((peerId) => {
    for (const conn of libp2p.getConnections(peerId)) {
      const addr = conn.remoteAddr.toString();
      if (peers.indexOf(addr) === -1) {
        console.log("Connection: ", conn.remoteAddr.toString());
        peers.push(addr);
      }
    }
  });
}

async function main() {
  const peerId = await getPeerId();
  const blockstore = new MemoryBlockstore();

  // application-specific data lives in the datastore
  const datastore = new MemoryDatastore();

  // libp2p is the networking layer that underpins Helia
  const libp2p = await createLibp2p({
    peerId,
    datastore,
    addresses: {
      announce: [`/dns4/${domainName}/tcp/4444/wss`],
      listen: ["/ip4/0.0.0.0/tcp/5555/ws", `/dns4/${domainName}/tcp/4444/wss`],
    },
    transports: [
      tcp(),
      webTransport(),
      webSockets({
        filter: filters.all,
      }),
    ],
    connectionEncryption: [noise(), tls()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: [
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
          "/dns4/swarm.io.cybernode.ai/tcp/443/wss/p2p/QmUgmRxoLtGERot7Y6G7UyF6fwvnusQZfGR15PuE6pY3aB",
        ],
      }),
    ],

    services: {
      identify: identify(),
      circuitRelay: circuitRelayServer(),
    },
  });

  libp2p.addEventListener("connection:open", () => updatePeerList(libp2p));
  libp2p.addEventListener("connection:close", () => updatePeerList(libp2p));

  return createHelia({
    datastore,
    blockstore,
    libp2p,
  }).then((helia) => {
    console.info("Helia is running");
    console.info("PeerId:", helia.libp2p.peerId.toString());
    console.log(
      "Helia multiaddr(s): ",
      helia.libp2p.getMultiaddrs().map((ma) => ma.toString())
    );

    return;
  });
}

void main()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://${domainName}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
