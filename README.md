# magicblock-grpc-example-ts

Small TypeScript repro for connecting to MagicBlock Yellowstone gRPC endpoints and printing ping, slot, account, and transaction updates.

## Prerequisites

- Node.js 18+ recommended
- `yarn` or `npm`

## Install

This repo declares both runtime dependencies and the `esbuild-runner` dev dependency in [`package.json`](/Users/thlorenz/dev/mb/repros/magicblock-grpc-example-ts/package.json).

Install them with either package manager:

### With yarn

```bash
yarn
```

### With npm

```bash
npm install
```

## Run `test-mb.ts`

After installing dependencies, run the script through the package `test` script.

### With yarn

```bash
yarn test
```

### With npm

```bash
npm test
```

## What it does

Running [`test-mb.ts`](/Users/thlorenz/dev/mb/repros/magicblock-grpc-example-ts/test-mb.ts) will:

- connect to `https://devnet.magicblock.app`
- connect to `https://devnet-as.magicblock.app`
- send a gRPC ping
- subscribe to slot and account updates
- wait about 5 seconds for streaming events
- print a summary for each endpoint

## Expected output

You should see log lines like:

```text
=== Testing: https://devnet.magicblock.app ===

=== Testing: https://devnet-as.magicblock.app ===
Connected
Ping OK: {"count":1}
Subscribed
Connected
Ping OK: {"count":1}
Subscribed
account update: 2BMdwfyqfDDbgPxNamBUh2fWoAUNZj8LHSAVEdrMNCGY
account update: 3BrJYqAp7TEwAe4zpNh9A4yoVLBfyenz1Vh5pLq2g9tk
account update: 3iyqQqpe6M11iqyZBkmSVvC34JMKF4BD3d29FFR7yeyN
[many more]

=== Summary for https://devnet.magicblock.app ===
Pongs: 0
Slots: 0
Account updates: 425
Transactions: 0

=== Summary for https://devnet-as.magicblock.app ===
Pongs: 0
Slots: 0
Account updates: 425
Transactions: 0
```

## Notes

- The script is currently hard-coded to test the URLs listed in `URLS` inside [`test-mb.ts`](/Users/thlorenz/dev/mb/repros/magicblock-grpc-example-ts/test-mb.ts).
- It uses `CommitmentLevel.PROCESSED` because the script notes that other commitment levels do not work with this gRPC setup.
