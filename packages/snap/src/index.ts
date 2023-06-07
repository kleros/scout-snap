import { OnTransactionHandler } from '@metamask/snaps-types';
import { panel, heading, text } from '@metamask/snaps-ui';

type AddressTag = {
  key0: string; // caip-10 address
  key1: string; // public name
  key2: string; // project name (optional, none is empty string)
  key3: string; // link to interface / info
};

type ContractDomain = {
  key0: string; // caip-10 address
  key1: string; // domain
};

type Token = {
  key0: string; // caip-10 address
  key1: string; // token name
  key2: string; // symbol
  // this below will have length 1, and contain an IPFS link to an image.
  props: {
    value: string;
  }[];
  // info on decimals could be fetched as well, but we deliberately don't get it.
};

type Insight = {
  value: string;
};

type GraphQLResponse = {
  data: {
    addressTags: AddressTag[];
    contractDomains: ContractDomain[];
    tokens: Token[];
  };
};

// For parsing out the domain
const getDomainFromUrl = (url: string): string | null => {
  const match = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/iu);
  if (match) {
    return match[1];
  }
  return null;
};

const fetchGraphQLData = async (variables: {
  targetAddress: string;
  domain: string;
}): Promise<GraphQLResponse> => {
  // Comments may be added on GraphQL queries with `#`. They were purposedly
  // not added here to save data. All 3 queries below have a hardcoded
  // registry, as only one Curate TCR contract is used for each data type,
  // for contracts on all chains.

  // There are three queries:
  // 1. addressTags is a general purpose registry of contract tags.
  // Contracts cannot be dupe, so we only fetch the first match.
  // 2. contractDomains links contract addresses and domains (for safety, phishing prevention...)
  // We are only interested on whether one exists, so we fetch first match.
  // 3. tokens contains names, symbols, decimals, etc, and a link to a logo.
  // Tokens cannot be dupe on address, so fetch first match.
  const query = `
  query($targetAddress: String!, $domain: String!) {
    addressTags: litems(where:{
      registry:"0x66260c69d03837016d88c9877e61e08ef74c59f2",
      key0_contains_nocase: $targetAddress,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      itemID
      key0
      key1
      key2
      key3
      key4
    }
    contractDomains: litems(where:{
      registry:"0x957a53a994860be4750810131d9c876b2f52d6e1",
      key0_contains_nocase: $targetAddress,
      key1: $domain,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      itemID
      key0
      key1
    }
    tokens: litems(where:{
      registry:"0x70533554fe5c17caf77fe530f77eab933b92af60",
      key0_contains_nocase: $targetAddress,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      itemID
      key0
      key1
      key2
      props(where: {label: "Logo"}) {
        value
      }
    }
  }
  `;
  const response = await fetch(
    'https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai',
    {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    },
  );

  const result = await response.json();
  return result;
};

const getInsights = async (
  caipAddress: string,
  domain: string,
): Promise<Insight[]> => {
  const result = await fetchGraphQLData({
    domain,
    targetAddress: caipAddress,
  });
  const projectNameLabel = result.data.addressTags[0]
    ? result.data.addressTags[0].key2 ?? '_N.A._'
    : '_Not found_';

  const contractTag = result.data.addressTags[0]
    ? result.data.addressTags[0].key1 // Don't handle "" because the registry _MUST NOT_ accept it.
    : '_Not found_';

  const verifiedDomain = result.data.contractDomains.length > 0;
  const insights: Insight[] = [
    {
      value: `**Project Name:** ${projectNameLabel}`,
    },
    {
      value: `**Contract Tag:** ${contractTag}`,
    },
    {
      value: verifiedDomain
        ? '**Domain**: Contract **verified** for this domain'
        : '**Domain**: Contract **not** recognized for this domain',
    },
  ];

  // Only adding this insight if token.
  // (Green) Can we put the logo info to use?

  // (GM) Maybe we can improve it to distinguish between token and non-token contracts
  // (function signatures maybe?)
  if (result.data.tokens.length > 0) {
    const tokenData = result.data.tokens[0];
    insights.push({
      // etherscan-like token syntax
      value: `**Token:** ${tokenData.key1} (${tokenData.key2})`,
    });
  }

  return insights;
};

export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  transaction,
  chainId,
}) => {
  const domain =
    getDomainFromUrl(transactionOrigin ?? 'NO_DOMAIN') ?? 'NO_DOMAIN';
  const numericChainId = parseInt(chainId.split(':')[1], 16);
  const caipAddress = `eip155:${numericChainId}:${transaction.to as string}`;
  console.log(JSON.stringify(transaction));

  const insights = await getInsights(caipAddress, domain);

  return {
    content: panel([
      heading('Contract insights from Kleros'),
      ...insights.map((insight) => text(insight.value)),
    ]),
  };
};
