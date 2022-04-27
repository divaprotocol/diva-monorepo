export const handler = async (event) => {
  /**
   * TODO: Authenticate token as eth signature using EIP-4361
   * https://eips.ethereum.org/EIPS/eip-4361
   */
  console.log(`event >`, JSON.stringify(event, null, 2));
  const response = {
    isAuthorized: true,
    resolverContext: {},
    deniedFields: [],
    ttlOverride: 10,
  };
  console.log(`response >`, JSON.stringify(response, null, 2));
  return response;
};
