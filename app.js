const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const cors = require("cors");
const fetch = require("node-fetch");
const converter = require("hex2dec");
const ethers = require("ethers");
const app = express();
app.use(cors());
const { MongoClient, ServerApiVersion } = require("mongodb");
app.use(bodyParser.json());
const uri = process.env.MONGO_URI;

const PORT = process.env.PORT || 8080;
const etherscanKey = process.env.ETHERSCAN_KEY;
const moralisKeyEth = process.env.MORALIS_API_ETHEREUM;
const covalentKey = process.env.COVALENT_API;
const courierKey = process.env.COURIER_API_KEY;
const quicknodeEth = process.env.QUICKNODE_ETHEREUM;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const checkLatestBlockEth = async () => {
  const chainId = 1;
  try {
    const url = `https://api.covalenthq.com/v1/1/block_v2/latest/?key=${covalentKey}`;
    const options = {
      method: "GET",
    };
    const response = await fetch(url, options);
    const data = await response.json();
    const currentBlock = data.data.items[0].height;
    return currentBlock;
  } catch (err) {
    console.log(err);
  }
};

const checkLatestBlockPolygon = async () => {
  const chainId = 1;
  try {
    const url = `https://api.covalenthq.com/v1/137/block_v2/latest/?key=${covalentKey}`;
    const options = {
      method: "GET",
    };
    const response = await fetch(url, options);
    const data = await response.json();
    const currentBlock = data.data.items[0].height;
    console.log(currentBlock);
    return currentBlock;
  } catch (err) {
    console.log(err);
  }
};

const handleNotifs = async (
  address,
  token,
  ticker,
  hash,
  network,
  template,
  table
) => {
  try {
    console.log(
      `You have received ${ticker} to ${address} which has address ${token} on chain with hash ${hash}`
    );
    await client.connect();
    const collection = client.db("Users").collection("userData");
    const tableLandUri = `https://testnet.tableland.network/query?mode=json&s=select%20*%20from%20${table}%20where%20wallet_address%20=%20%27${address}%27%20and%20token%20=%20%27${token}%27`;
    const optionsTableland = {
      method: "GET",
    };
    const responseTableland = await fetch(tableLandUri, optionsTableland);
    const dataTableland = await responseTableland.json();
    const poster = dataTableland[0].posted_by;
    const wallet = converter.decToHex(poster);
    console.log(wallet);
    const user = await collection.findOne({ walletAddress: wallet });
    userEmail = user.email;

    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + courierKey,
      },
      body: JSON.stringify({
        message: {
          template: template,
          data: {
            wallet: address,
            token: ticker,
            network: network,
            txHash: hash,
          },
          to: {
            email: userEmail,
          },
          brand_id: "N3CA06ENV84GRMMDWVJF3DT615E0",
        },
      }),
    };

    const response = await fetch("https://api.courier.com/send", options);
    const data = await response.json();
    console.log(data);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
};

// const handleNotifsWithdraw = async (address, token, ticker, hash) => {
//   await console.log(
//     `You have sent ${ticker} from ${address} which has address ${token} on chain with hash ${hash}`
//   );
// };

const tableLand = async (table) => {
  try {
    const tableLandUrl =
      "https://testnet.tableland.network/query?mode=json&s=select%20wallet_address,%20token%20from%20" +
      table;
    const optionsTableland = {
      method: "GET",
    };
    const responseTableland = await fetch(tableLandUrl, optionsTableland);
    const dataTableland = await responseTableland.json();
    return dataTableland;
  } catch (err) {
    console.log(err);
  }
};

const demo = async () => {
  try {
    const endBlock = await checkLatestBlockEth();
    const dataTableland = await tableLand("cue_notify_5_770");
    console.log(dataTableland);
    for (let i = 0; i < dataTableland.length; i++) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          "https://weathered-capable-smoke.discover.quiknode.pro/" +
            quicknodeEth
        );
        provider.connection.headers = { "x-qn-api-version": 1 };
        const heads = await provider.send("qn_getWalletTokenTransactions", {
          address: "0x7a721260416e764618b059811eaf099a940af14",
          contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        });
        console.log(heads);
        // items.forEach(async (item) => {
        //   const transferDetail = item.transfers[0];
        //   console.log(transferDetail);
        //   if (transferDetail.transfer_type == "OUT") {
        //     await handleNotifs(
        //       transferDetail.from_address,
        //       transferDetail.contract_address,
        //       transferDetail.contract_ticker_symbol,
        //       transferDetail.tx_hash,
        //       "Polygon",
        //       "E4VTHCED2EMGBZKBNGV21H8M6D0Y",
        //       "cue_notify_80001_2604"
        //     );
        //   } else if (transferDetail.transfer_type == "IN") {
        //     await handleNotifs(
        //       transferDetail.to_address,
        //       transferDetail.contract_address,
        //       transferDetail.contract_ticker_symbol,
        //       transferDetail.tx_hash,
        //       "Polygon",
        //       "TAAZ4M470SMWFPG9E9K64ZBQ1847",
        //       "cue_notify_80001_2604"
        //     );
        //   }
        // });
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const demo2 = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://weathered-capable-smoke.discover.quiknode.pro/517a38550ddfc089ac0758e6cb65b3a6741433cf/"
  );
  provider.connection.headers = { "x-qn-api-version": 1 };
  const heads = await provider.send("qn_getWalletTokenTransactions", {
    address: "0x7a721260416e764618b059811eaf099a940af14",
    contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  });
  console.log(heads);
};

let startPolygonBlock = 33498124;

const job = schedule.scheduleJob("*/1 * * * *", async function () {
  try {
    console.log(startPolygonBlock);
    const endBlock = await checkLatestBlockPolygon();
    const dataTableland = await tableLand("cue_notify_80001_2604");
    console.log(dataTableland);
    for (let i = 0; i < dataTableland.length; i++) {
      try {
        const url = `https://api.covalenthq.com/v1/137/address/${dataTableland[i].wallet_address}/transfers_v2/?quote-currency=USD&format=JSON&contract-address=${dataTableland[i].token}&starting-block=${startPolygonBlock}&ending-block=${endBlock}&key=${covalentKey}`;
        const options = {
          method: "GET",
        };
        const response = await fetch(url, options);
        const data = await response.json();
        const items = data.data.items;
        items.forEach(async (item) => {
          const transferDetail = item.transfers[0];
          console.log(transferDetail);
          if (transferDetail.transfer_type == "OUT") {
            await handleNotifs(
              transferDetail.from_address,
              transferDetail.contract_address,
              transferDetail.contract_ticker_symbol,
              transferDetail.tx_hash,
              "Polygon",
              "E4VTHCED2EMGBZKBNGV21H8M6D0Y",
              "cue_notify_80001_2604"
            );
          } else if (transferDetail.transfer_type == "IN") {
            await handleNotifs(
              transferDetail.to_address,
              transferDetail.contract_address,
              transferDetail.contract_ticker_symbol,
              transferDetail.tx_hash,
              "Polygon",
              "TAAZ4M470SMWFPG9E9K64ZBQ1847",
              "cue_notify_80001_2604"
            );
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    startPolygonBlock = endBlock;
  } catch (err) {
    console.log(err);
  }
});

// const job2 = schedule.scheduleJob("*/1 * * * *", async function () {
//   const endBlock = await checkLatestBlockEth();
//   const dataTableland = await tableLand("cue_notify_5_770");
//   console.log(dataTableland);
//   for (let i = 0; i < dataTableland.length; i++) {
//     for (let i = 0; i < dataTableland.length; i++) {
//       try {
//         const provider = new ethers.providers.JsonRpcProvider(
//           "https://weathered-capable-smoke.discover.quiknode.pro/" + quicknodeEth
//         );
//         provider.connection.headers = { "x-qn-api-version": 1 };
//         const heads = await provider.send("qn_getWalletTokenTransactions", {
//           address: "0x07a721260416e764618B059811eaf099a940Af14",
//           contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
//         });
//         console.log(heads);
//         items.forEach(async (item) => {
//           const transferDetail = item.transfers[0];
//           console.log(transferDetail);
//           if (transferDetail.transfer_type == "OUT") {
//             await handleNotifs(
//               transferDetail.from_address,
//               transferDetail.contract_address,
//               transferDetail.contract_ticker_symbol,
//               transferDetail.tx_hash,
//               "Polygon",
//               "E4VTHCED2EMGBZKBNGV21H8M6D0Y",
//               "cue_notify_80001_2604"
//             );
//           } else if (transferDetail.transfer_type == "IN") {
//             await handleNotifs(
//               transferDetail.to_address,
//               transferDetail.contract_address,
//               transferDetail.contract_ticker_symbol,
//               transferDetail.tx_hash,
//               "Polygon",
//               "TAAZ4M470SMWFPG9E9K64ZBQ1847",
//               "cue_notify_80001_2604"
//             );
//           }
//         });
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   }
// })
// demo2();
app.listen(PORT);
