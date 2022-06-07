import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

export const handler = async (event) => {
  console.log("validate orders");
  const client = new DynamoDBClient({ region: "us-west-2" });
  const command = new ListTablesCommand({});
  try {
    const results = await client.send(command);
    console.log(results.TableNames.join("\n"));
  } catch (err) {
    console.error(err);
  }
  /**
   * 1. Get all unexpired orders in database
   * 2. Get balances or allowances per chain from 0x contract using
   * getMinOfBalancesOrAllowances
   * https://github.com/0xProject/protocol/blob/24397c51a8c7bf704948c8fc6874843bccd5d244/packages/asset-swapper/contracts/src/BalanceChecker.sol#L69-L89
   * 3. Update orders on DD
   */

};
