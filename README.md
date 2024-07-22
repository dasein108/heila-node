## Helia for node.js setup

Helia IPFS node with relay implementation.
Unlike Kubo(most popular IPFS implementation in GO), Helia depends on js-libp2p and support webRTC that allows Helia browser nodes create connection with each other(browser-to-browser).

## Preparation

Create static peerId `node src/genPeerId.js`, as result you get `peer.json` with perrId keys.

## Run

`docker-compose up`

## Usage in browser

- Include Helia(node.js) in bootstrap list for libp2p instance used for Helia: `/dns4/acidpictures.ink/tcp/4444/wss/p2p/12D3KooWE3yj6jibgZcxMb6hrpQGKRE9xaqAazFkYaJZDZengzHq`
- Use libp2p methods to connect it on fly: `heliaNode.libp2p!.dial(multiaddr(heliaReleayerAddress))`

## Hosting

Caddy generate self-signed certificates automatically, to use your own copy it to `/certs` directory, and update `Caddyfile` from `tls` to `tls /etc/caddy/certs/acidpictures_ink_chain.crt /etc/caddy/certs/acidpictures_ink.key`
