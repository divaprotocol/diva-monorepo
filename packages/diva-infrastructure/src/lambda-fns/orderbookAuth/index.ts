export const handler = async (event) => {
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
