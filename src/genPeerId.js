import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import fs from "fs";

async function createJsonPeer() {
  const peerId = await createEd25519PeerId();

  return {
    id: peerId.toString(),
    privateKey: Buffer.from(peerId.privateKey).toString("base64"),
    publicKey: Buffer.from(peerId.publicKey).toString("base64"),
  };
}

function saveJson(jsonPeer, path) {
  const json = JSON.stringify(jsonPeer, null, 2);
  fs.writeFileSync(path, json);
  console.log("Saved to", path);
}

void createJsonPeer()
  .then((peerInfo) => {
    saveJson(peerInfo, "./peer.json");
    console.log(peerInfo);
  })
  .catch(console.error);
