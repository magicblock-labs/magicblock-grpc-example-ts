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

type TestResult = {
  url: string;
  slotCount: number;
  accountCount: number;
  stream: ClientDuplexStream;
};

async function testUrl(url: string): Promise<TestResult> {
  console.log("\n=== Testing: " + url + " ===");

  const client = new Client(url, undefined, undefined);
  await client.connect();
  console.log("Connected");

  const stream = await client.subscribe();
  let slotCount = 0;
  let accountCount = 0;

  stream.on("data", (data: SubscribeUpdate) => {
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
    slotCount,
    accountCount,
    stream,
  };
}

async function main(): Promise<void> {
  const results = await Promise.all(URLS.map(testUrl));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(`\n=== Summary for ${result.url} ===`);
    console.log("Slots:", result.slotCount);
    console.log("Account updates:", result.accountCount);
  }
}

main().catch(console.error);
