const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const cors = require("cors");
const fetch = require("node-fetch");
const converter = require("hex2dec");
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
  console.log(covalentKey);
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

const tableLand = async () => {
  try {
    const tableLandUrl =
      "https://testnet.tableland.network/query?mode=json&s=select%20wallet_address,%20token%20from%20cue_notify_80001_2604";
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

// const demo = async () => {
//   try {
//     const endBlock = await checkLatestBlockPolygon();
//     const dataTableland = await tableLand();
//     console.log(dataTableland);
//     for (let i = 0; i < dataTableland.length; i++) {
//       try {
//         const url = `https://api.covalenthq.com/v1/137/address/${dataTableland[i].wallet_address}/transfers_v2/?quote-currency=USD&format=JSON&contract-address=${dataTableland[i].token}&key=${covalentKey}`;
//         const options = {
//           method: "GET",
//         };
//         const response = await fetch(url, options);
//         const data = await response.json();
//         const items = data.data.items;
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
//               "E4VTHCED2EMGBZKBNGV21H8M6D0Y"
//             );
//           } else if (transferDetail.transfer_type == "IN") {
//             await handleNotifs(
//               transferDetail.to_address,
//               transferDetail.contract_address,
//               transferDetail.contract_ticker_symbol,
//               transferDetail.tx_hash,
//               "Polygon",
//               "TAAZ4M470SMWFPG9E9K64ZBQ1847"
//             );
//           }
//         });
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

const job = schedule.scheduleJob("*/1 * * * *", async function () {
  try {
    const endBlock = await checkLatestBlockPolygon();
    const dataTableland = await tableLand();
    console.log(dataTableland);
    for (let i = 0; i < dataTableland.length; i++) {
      try {
        const url = `https://api.covalenthq.com/v1/137/address/${dataTableland[i].wallet_address}/transfers_v2/?quote-currency=USD&format=JSON&contract-address=${dataTableland[i].token}&key=${covalentKey}`;
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
  } catch (err) {
    console.log(err);
  }
});

demo();

app.listen(PORT);
