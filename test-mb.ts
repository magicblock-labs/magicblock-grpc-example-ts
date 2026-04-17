import Client, {
  CommitmentLevel,
  ClientDuplexStream,
  SubscribeRequest,
  SubscribeRequestAccountsDataSlice,
  SubscribeRequestFilterAccounts,
  SubscribeRequestFilterBlocks,
  SubscribeRequestFilterBlocksMeta,
  SubscribeRequestFilterEntry,
  SubscribeRequestFilterSlots,
  SubscribeRequestFilterTransactions,
  SubscribeUpdate,
} from "@triton-one/yellowstone-grpc";
import bs58 from "bs58";

const URLS: string[] = [
  "https://devnet.magicblock.app",
  "https://devnet-as.magicblock.app",
];

const PROGRAM_ID = "FMTgsEDaPPfJi1PKD67McLTC5n833T4irbBP53LLxtvj";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

type TestResult = {
  url: string;
  pongCount: number;
  slotCount: number;
  accountCount: number;
  transactionCount: number;
  stream: ClientDuplexStream;
};

async function testUrl(url: string): Promise<TestResult> {
  console.log("\n=== Testing: " + url + " ===");

  const client = new Client(url, undefined, undefined);
  await client.connect();
  console.log("Connected");

  const pong = await client.ping(1);
  console.log("Ping OK:", JSON.stringify(pong));

  const stream = await client.subscribe();
  let pongCount = 0;
  let pingCount = 0;
  let slotCount = 0;
  let accountCount = 0;
  let transactionCount = 0;

  stream.on("data", (data: SubscribeUpdate) => {
    if (data.ping != null) {
      pingCount++;
      console.log("ping");
      return;
    }
    if (data.pong != null) {
      pongCount++;
      console.log("pong");
      return;
    }
    if (data.slot?.slot != null) {
      slotCount++;
      console.log("slot:", String(data.slot.slot));
      return;
    }
    if (data.account?.account != null) {
      accountCount++;

      const pubkey = bs58.encode(data.account.account.pubkey);
      console.log("account update:", pubkey);
      return;
    }
    if (data.transaction?.transaction != null) {
      transactionCount++;
      console.log("transaction");
      return;
    }
  });

  stream.on("error", (err: Error) => {
    console.error(err);
    console.error("ERROR:", err.message);
  });

  const accounts: { [key: string]: SubscribeRequestFilterAccounts } = {
    client: {
      account: [],
      owner: [PROGRAM_ID /* Not allowed: SYSTEM_PROGRAM_ID */],
      filters: [],
    },
  };
  // NOTE: The below results in slot updates even if we use CONFIRMED commitment level
  // Setting this to `true` instead results in no slot updates at all
  const slots: { [key: string]: SubscribeRequestFilterSlots } = {
    client: { filterByCommitment: false },
  };
  const transactions: { [key: string]: SubscribeRequestFilterTransactions } =
    {};
  const clientTxFilter: SubscribeRequestFilterTransactions = {
    vote: false,
    accountInclude: [],
    accountExclude: [],
    accountRequired: [],
  };
  const transactionsStatus: {
    [key: string]: SubscribeRequestFilterTransactions;
  } = {};
  const entry: { [key: string]: SubscribeRequestFilterEntry } = {};
  const blocks: { [key: string]: SubscribeRequestFilterBlocks } = {};
  const blocksMeta: { [key: string]: SubscribeRequestFilterBlocksMeta } = {};
  const accountsDataSlice: SubscribeRequestAccountsDataSlice[] = [];

  const subscribeRequest: SubscribeRequest = {
    accounts,
    slots,
    transactions,
    transactionsStatus,
    entry,
    blocks,
    blocksMeta,
    accountsDataSlice,
    // NOTE: no other commitment level works with our GRPC
    commitment: CommitmentLevel.PROCESSED,
  };

  stream.write(subscribeRequest, (err?: Error | null) => {
    if (err) console.error("Subscribe error:", err);
    else console.log("Subscribed");
  });

  // sleep for 5 secs before returning results to allow some streaming data to come in
  await new Promise((resolve) => setTimeout(resolve, 5000));

  stream.end();
  stream.destroy();

  return {
    url,
    pongCount,
    slotCount,
    accountCount,
    transactionCount,
    stream,
  };
}

async function main(): Promise<void> {
  const results = await Promise.all(URLS.map(testUrl));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(`\n=== Summary for ${result.url} ===`);
    console.log("Pongs:", result.pongCount);
    console.log("Slots:", result.slotCount);
    console.log("Account updates:", result.accountCount);
    console.log("Transactions:", result.transactionCount);
  }
}

main().catch(console.error);
