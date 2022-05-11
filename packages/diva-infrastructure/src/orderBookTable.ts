import { Construct } from "constructs";
import { id } from "./lib/id";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb";
import { tags } from "./lib/tags";


export function orderBookTable(construct: Construct) {
  const table = new DynamodbTable(construct, id("OrderbookTable"), {
    name: id("Orderbook0Table"),
    readCapacity: 10,
    writeCapacity: 1,
    hashKey: "makerToken",
    rangeKey: "id",

    attribute: [
      {
        name: "makerToken",
        type: "S",
      },
      {
        name: "id",
        type: "S",
      },
      {
        name: "takerToken",
        type: "S",
      },
      {
        name: "maker",
        type: "S",
      },
      {
        name: "chainId",
        type: "S",
      },
      {
        name: "expiry",
        type: "N",
      },
    ],
    globalSecondaryIndex: [
      {
        name: "OrderBookIndex",
        hashKey: "makerToken",
        rangeKey: "takerToken",
        projectionType: "ALL",
        writeCapacity: 1,
        readCapacity: 10,
      },
      {
        name: "MakerIndex",
        hashKey: "maker",
        rangeKey: "makerToken",
        projectionType: "ALL",
        writeCapacity: 1,
        readCapacity: 10,
      },
      {
        name: "ChainAndExpiry",
        hashKey: "chainId",
        rangeKey: "expiry",
        projectionType: "ALL",
        writeCapacity: 1,
        readCapacity: 10,
      },
    ],
    tags: tags({}),
  });

  return table;
}
