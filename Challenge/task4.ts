import { config as dotenv } from "dotenv";
import {
  createWalletClient,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { scroll } from "viem/chains";

dotenv();
const { PRIVATE_KEY, ZERO_EX_API_KEY, ALCHEMY_HTTP_TRANSPORT_URL } =
  process.env;

if (!PRIVATE_KEY) throw new Error("missing PRIVATE_KEY.");
if (!ZERO_EX_API_KEY) throw new Error("missing ZERO_EX_API_KEY.");
if (!ALCHEMY_HTTP_TRANSPORT_URL)
  throw new Error("missing ALCHEMY_HTTP_TRANSPORT_URL.");

const client = createWalletClient({
  account: privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`),
  chain: scroll,
  transport: http(ALCHEMY_HTTP_TRANSPORT_URL),
}).extend(publicActions);

// TASK 4: Display liquidity sources

const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
});

const main = async () => {
  const quoteParams = new URLSearchParams();
  quoteParams.append("chainId", client.chain.id.toString());

  const response = await fetch(
    "https://api.0x.org/sources?" + quoteParams.toString(),
    {
      headers,
    }
  );

  const data = await response.json();
  console.log(
    `Liquidity sources for Scroll chain: \n  ${data.sources.join(",\n  ")}`
  );
};

main();
