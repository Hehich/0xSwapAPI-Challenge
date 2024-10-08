import { config as dotenv } from "dotenv";
import {
  createWalletClient,
  erc20Abi,
  formatUnits,
  getContract,
  http,
  parseUnits,
  publicActions,
} from "viem";
import { wethAbi } from "./abi/weth-abi";
import { privateKeyToAccount } from "viem/accounts";
import { scroll } from "viem/chains";

dotenv();
const { PRIVATE_KEY, ZERO_EX_API_KEY, ALCHEMY_HTTP_TRANSPORT_URL } =
  process.env;

if (!PRIVATE_KEY) throw new Error("missing PRIVATE_KEY.");
if (!ZERO_EX_API_KEY) throw new Error("missing ZERO_EX_API_KEY.");
if (!ALCHEMY_HTTP_TRANSPORT_URL)
  throw new Error("missing ALCHEMY_HTTP_TRANSPORT_URL.");

// TASK 3: Display token tax

const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
});

const client = createWalletClient({
  account: privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`),
  chain: scroll,
  transport: http(ALCHEMY_HTTP_TRANSPORT_URL),
}).extend(publicActions);

const weth = getContract({
  address: "0x5300000000000000000000000000000000000004",
  abi: wethAbi,
  client,
});

const wsteth = getContract({
  address: "0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32",
  abi: erc20Abi,
  client,
});

const main = async () => {
  const decimals = (await weth.read.decimals()) as number;
  const sellAmount = parseUnits("0.1", decimals);

  const priceParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: weth.address,
    buyToken: wsteth.address,
    sellAmount: sellAmount.toString(),
    taker: client.account.address,
  });

  const quoteParams = new URLSearchParams();
  for (const [key, value] of priceParams.entries()) {
    quoteParams.append(key, value);
  }

  console.log(
    `Fetching quote to swap ${formatUnits(
      sellAmount,
      decimals
    )} WETH for wstETH`
  );

  const quoteResponse = await fetch(
    "https://api.0x.org/swap/permit2/quote?" + quoteParams.toString(),
    {
      headers,
    }
  );

  const quote = await quoteResponse.json();
  const { tokenMetadata } = quote;

  console.log(
    `Buy Token Buy Tax: ${tokenMetadata.buyToken.buyTaxBps / 100}%\n`,
    `Buy Token Sell Tax: ${tokenMetadata.buyToken.sellTaxBps / 100}%\n`,
    `Sell Token Buy Tax: ${tokenMetadata.sellToken.buyTaxBps / 100}%\n`,
    `Sell Token Sell Tax: ${tokenMetadata.sellToken.sellTaxBps / 100}%\n`
  );
  console.log();
};

main();
