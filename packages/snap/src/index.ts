import { OnTransactionHandler } from '@metamask/snaps-types';
import { panel, heading, text } from '@metamask/snaps-ui';
// eslint-disable-next-line import/no-extraneous-dependencies
import mdEscape from 'markdown-escape';

type AddressTag = {
  caipAddress: string;
  publicName: string;
  projectName: string;
  infoLink: string;
};

type ContractDomain = {
  caipAddress: string;
  domain: string;
};

type Token = {
  caipAddress: string;
  name: string;
  symbol: string;
};

type CuratedInfo = {
  addressTag?: AddressTag;
  contractDomain?: ContractDomain;
  token?: Token;
};

const fetchGraphQLData = async (variables: {
  targetAddress: string;
  domain: string;
}): Promise<CuratedInfo | null> => {
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

  // The way legal CAIP-10 strings work, if it starts and ends with the passed address string,
  // no other CAIP-10 legal string should match (since it would require having more than 2 ":" characters)
  // there is no "key0_nocase" query.
  const query = `
  query($targetAddress: String!, $domain: String!) {
    addressTags: litems(where:{
      registry:"0x66260c69d03837016d88c9877e61e08ef74c59f2",
      key0_starts_with_nocase: $targetAddress,
      key0_ends_with_nocase: $targetAddress,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      key0
      key1
      key2
      key3
    }
    contractDomains: litems(where:{
      registry:"0x957a53a994860be4750810131d9c876b2f52d6e1",
      key0_starts_with_nocase: $targetAddress,
      key0_ends_with_nocase: $targetAddress,
      key1: $domain,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      key0
      key1
    }
    tokens: litems(where:{
      registry:"0x70533554fe5c17caf77fe530f77eab933b92af60",
      key0_starts_with_nocase: $targetAddress,
      key0_ends_with_nocase: $targetAddress,
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      key0
      key1
      key2
    }
  }
  `;

  let result: any;

  try {
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

    result = await response.json();
    if (result.data === undefined) {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }

  // Kleros Curate is a generalized registry, and is indexed by a generalized subgraph.
  // Indexed fields are written into fields such as key0, key1...
  // To make this code more readable, they are parsed onto the types at the beginning of this file.

  const parsedAddressTag: AddressTag | undefined = result.data.addressTags[0]
    ? {
        caipAddress: mdEscape(result.data.addressTags[0].key0),
        publicName: mdEscape(result.data.addressTags[0].key1),
        projectName: mdEscape(result.data.addressTags[0].key2),
        infoLink: mdEscape(result.data.addressTags[0].key3),
      }
    : undefined;

  const parsedContractDomain: ContractDomain | undefined = result.data
    .contractDomains[0]
    ? {
        caipAddress: mdEscape(result.data.contractDomains[0].key0),
        domain: mdEscape(result.data.contractDomains[0].key1),
      }
    : undefined;

  const parsedToken: Token | undefined = result.data.tokens[0]
    ? {
        caipAddress: mdEscape(result.data.tokens[0].key0),
        name: mdEscape(result.data.tokens[0].key1),
        symbol: mdEscape(result.data.tokens[0].key2),
      }
    : undefined;

  const curatedInfo: CuratedInfo = {
    addressTag: parsedAddressTag,
    contractDomain: parsedContractDomain,
    token: parsedToken,
  };
  return curatedInfo;
};

/**
 * Fetch and parse TCR data from the subgraph, generates human readable insights.
 *
 * @param caipAddress - https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md
 * @param domain - Domain that launched the contract interaction
 * @returns List of resolved insights to display to the user
 */

const getInsights = async (
  caipAddress: string,
  domain: string,
): Promise<string[]> => {
  const result = await fetchGraphQLData({
    domain,
    targetAddress: caipAddress,
  });

  if (result === null) {
    return ['**Error:** Could not connect to the server.'];
  }

  const insights: string[] = [];
  if (result.addressTag) {
    // key2 is projectName, which is optional. No project name === "", which is falsy.
    const projectNameLabel = result.addressTag.projectName
      ? // If there is a project name, we TRUST the registry to pass a link.
        // todo: when links are a feature, use result.addressTag.infoLink and turn into markdown link
        result.addressTag.projectName
      : '_N.A._';
    // Don't handle "" because the registry _MUST NOT_ accept it. The registry is TRUSTED.
    // Contract tag is a mandatory field.
    const contractTag = result.addressTag.publicName;
    insights.push(`**Project:** ${projectNameLabel}`);
    insights.push(`**Contract Tag:** ${contractTag}`);
  } else {
    // Contract was not tagged in Address Tags. Let the user know, and provide a link to tag it.
    // Note: current @metamask/snaps-ui does not allow markdown links, so no links in this version.
    // todo: when links are a feature, turn them into [Tag me](https://curate.kleros.io/...), deeplink:
    // const uri = new URL('https://curate.kleros.io/tcr/100/0x66260c69d03837016d88c9877e61e08ef74c59f2');
    // uri.searchParams.append('action', 'submit');
    // uri.searchParams.append('Contract Address', caipAddress);
    // uri.toString();
    const addressNotFound = `**Contract Tag:** _Not Found_`;
    insights.push(addressNotFound);
  }

  const domainLabel = result.contractDomain
    ? `**Domain:** _${domain}_ is **verified** for this contract`
    : // todo: when links are a feature, deeplink:
      // const uri = new URL('https://curate.kleros.io/tcr/100/0x957A53A994860BE4750810131d9c876b2f52d6E1');
      // uri.searchParams.append('action', 'submit');
      // uri.searchParams.append('Contract Address', caipAddress);
      // uri.searchParams.append('Domain Name', domain);
      // uri.toString();
      `**Domain:** _${domain}_ is **NOT verified** for this contract
`;
  insights.push(domainLabel);

  // Token information is only shown if confirmed to be a token.
  if (result.token) {
    insights.push(
      // etherscan-like token syntax
      `**Token:** ${result.token.name} (${result.token.symbol})`,
    );
  }

  return insights;
};

export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  transaction,
  chainId,
}) => {
  let domain = 'NO_DOMAIN';
  if (transactionOrigin) {
    try {
      domain = new URL(transactionOrigin).hostname;
    } catch (error) {
      console.error(error);
    }
  }
  const numericChainId = parseInt(chainId.split(':')[1], 16);
  const caipAddress = `eip155:${numericChainId}:${transaction.to as string}`;
  console.log(JSON.stringify(transaction));

  const insights = await getInsights(caipAddress, domain);

  return {
    content: panel([
      heading('Contract insights'),
      ...insights.map((insight) => text(insight)),
    ]),
  };
};
