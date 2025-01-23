import {
  OnHomePageHandler,
  OnTransactionHandler,
  OnInstallHandler,
  panel,
  text,
  heading,
  divider,
  image,
  OnSignatureHandler,
  SeverityLevel
} from '@metamask/snaps-sdk';
// eslint-disable-next-line import/no-extraneous-dependencies
import mdEscape from 'markdown-escape';
import InsightsDisplayImage from '../images/insights-display.svg';
import ProcessExplanationImage from '../images/process-explanation.svg';

// Define types
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

const parseMetadata = (metadata: any, keys: string[]) => {
  return keys.reduce((acc, key, index) => {
    acc[key] = mdEscape(metadata[`key${index}`]);
    return acc;
  }, {} as any);
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
      metadata_: {
        key0_starts_with_nocase: $targetAddress,
        key0_ends_with_nocase: $targetAddress,
      },
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      metadata {
        key0
        key1
        key2
        key3
      }
    }
    contractDomains: litems(where:{
      registry:"0x957a53a994860be4750810131d9c876b2f52d6e1",
      metadata_: {
        key0_starts_with_nocase: $targetAddress,
        key0_ends_with_nocase: $targetAddress,
        key1: $domain,
      },
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      metadata {
        key0
        key1
      }
    }
    tokens: litems(where:{
      registry:"0x70533554fe5c17caf77fe530f77eab933b92af60",
      metadata_: {
        key0_starts_with_nocase: $targetAddress,
        key0_ends_with_nocase: $targetAddress,
      },
      status_in:[Registered, ClearingRequested]
    }, first: 1) {
      metadata {
        key0
        key1
        key2
      }
    }
  }
  `;

  try {
    const response = await fetch(
      'https://api.goldsky.com/api/public/project_cm5y7hx91t6zd01vzfnfchtf9/subgraphs/legacy-curate-gnosis/latest/gn',
      {
        method: 'POST',
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      },
    );

  // Kleros Curate is a generalized registry, and is indexed by a generalized subgraph.
  // Indexed fields are written into fields such as key0, key1...
  // To make this code more readable, they are parsed onto the types at the beginning of this file.
    if (!response.ok) return null;

    const result = await response.json();
    if (!result.data) return null;

    const parsedAddressTag = result.data.addressTags[0]
      ? parseMetadata(result.data.addressTags[0].metadata, ['caipAddress', 'publicName', 'projectName', 'infoLink'])
      : undefined;

    const parsedContractDomain = result.data.contractDomains[0]
      ? parseMetadata(result.data.contractDomains[0].metadata, ['caipAddress', 'domain'])
      : undefined;

    const parsedToken = result.data.tokens[0]
      ? parseMetadata(result.data.tokens[0].metadata, ['caipAddress', 'name', 'symbol'])
      : undefined;

    return { addressTag: parsedAddressTag, contractDomain: parsedContractDomain, token: parsedToken };
  } catch (error) {
    console.error('GraphQL fetch error:', error);
    return null;
  }
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

  // If insight search has no result in a category, the result is omitted.
  const insights: string[] = [];

  if (result.addressTag) {
    // key2 is projectName, which is optional. No project name === "", which is falsy.
    const projectNameLabel = result.addressTag.projectName
      ? result.addressTag.infoLink
        ? `[${result.addressTag.projectName}](${result.addressTag.infoLink})`
        : result.addressTag.projectName
      : '_N.A._';
    // Don't handle "" because the registry _MUST NOT_ accept it. The registry is TRUSTED.
    // Contract tag is a mandatory field.
    const contractTag = result.addressTag.publicName;
    insights.push(`**Project:** ${projectNameLabel}`);
    insights.push(`**Contract Tag:** ${contractTag}`);
  }

  if (result.contractDomain) {
    insights.push(`**Domain:** _${domain}_ is **verified** for this contract`);
  }

  if (result.token) {
    insights.push(`**Token:** ${result.token.name} (${result.token.symbol})`);
  }

  return insights;
};

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading(
          'Kleros Scout’s community curated contract insights secures your dApp browsing.',
        ),
        text(
          'Congrats on taking a crucial step towards safeguarding your wallet interactions!',
        ),
        divider(),
        heading('How to use the Snap?'),
        text(
          'The Kleros Scout Snap provides 3 points of insight on every transaction:',
        ),
        text(
          '**Project:** _Which project does the contract you’re interacting with belong to?_',
        ),
        text(
          '**Contract Tag:** _What is the function or tag associated with the smart contract?_',
        ),
        text('**Domain:** _Whether this contract is known to be used on this domain?_'),
        image(InsightsDisplayImage),
      ]),
    },
  });
};

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: panel([
      heading(
        'Kleros Scout’s community curated contract insights secures your dApp browsing.',
      ),
      divider(),
      heading('How does it work?'),
      text(
        'Anyone can submit contract insights & earn up to $15 per entry! [Head here to know more.](https://klerosscout.eth.limo)',
      ),
      image(ProcessExplanationImage),
    ]),
  };
};

export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  transaction,
  chainId,
}) => {
  let domain = 'NO_DOMAIN';
  const insights: string[] = [];
  if (transactionOrigin) {
    try {
      domain = new URL(transactionOrigin).hostname;
    } catch (error) {
      console.error('Invalid transaction origin:', error);
    }
  }
  const numericChainId = parseInt(chainId.split(':')[1], 16);
  const caipAddress = `eip155:${numericChainId}:${transaction.to as string}`;

  const result = await getInsights(caipAddress, domain);

  if (result.length > 0) {
    insights.push(...result);
  } else {
    insights.push(`No insights available for this contract. Interact at your own risk.`);
  }

  const excludedDomains = [
    'etherscan.io', 'bscscan.com', 'gnosisscan.io', 'polygonscan.com',
    'mempool.space', 'explorer.solana.com', 'basescan.org', 'arbiscan.io',
    'moonscan.io', 'lineascan.build', 'optimistic.etherscan.io', 'ftmscan.com',
    'moonriver.moonscan.io', 'snowscan.xyz', 'cronoscan.com', 'bttcscan.com',
    'zkevm.polygonscan.com', 'wemixscan.com', 'scrollscan.com', 'era.zksync.network', 'celoscan.io'
  ];

  if (!excludedDomains.includes(domain) && !insights.some(insight => insight.includes('Domain'))) {
    const cdnPathURL = `https://app.klerosscout.eth.limo/#/?registry=CDN&network=1&network=100&network=137&network=56&network=42161&network=10&network=43114&network=534352&network=42220&network=8453&network=250&network=324&status=Registered&status=RegistrationRequested&status=ClearingRequested&status=Absent&disputed=true&disputed=false&page=1&orderDirection=desc&&additem=CDN&caip10Address=${caipAddress}&domain=${domain}`;

    insights.push(`Is this contract linked to this domain? If so, submit the info at [Scout App](${cdnPathURL}) to verify it for all users!`);
  }

  return {
    content: panel([
      heading('Contract insights'),
      ...insights.map((insight) => text(insight)),
    ]),
  };
};

export const onSignature: OnSignatureHandler = async ({ signature, signatureOrigin }) => {
  const { signatureMethod, data } = signature;
  const insights: string[] = [];

  if (
    signatureMethod === 'eth_signTypedData_v3' ||
    signatureMethod === 'eth_signTypedData_v4'
  ) {
    const verifyingContract = data?.domain?.verifyingContract;
    const numericChainId = data?.domain?.chainId;
    const caipAddress = `eip155:${numericChainId}:${verifyingContract as string}`;

    if (verifyingContract) {
      const result = await getInsights(caipAddress, signatureOrigin || 'NO_DOMAIN');

      if (result.length > 0) {
        insights.push(...result);
      } else {
        insights.push('No insights available for this contract. Interact at your own risk.');
      }
    } else {
      insights.push('No verifying contract found in the signature data.');
    }
  } else return null;

  return {
    content: panel([
      heading('Signature Insights'),
      ...insights.map((insight) => text(insight)),
    ]),
    severity: SeverityLevel.Critical,
  };
};

/*
  
Note: current @metamask/snaps-ui does not allow markdown links, so no links in this version.
todo: when links are a feature, create links to direct user towards submitting.
or, to direct user towards seeing the submissions in case they believe they're wrong?

add contract tags link:
const uri = new URL('https://curate.kleros.io/tcr/100/0x66260c69d03837016d88c9877e61e08ef74c59f2');
uri.searchParams.append('action', 'submit');
uri.searchParams.append('Contract Address', caipAddress);
uri.toString();

add contract domain link:
const uri = new URL('https://curate.kleros.io/tcr/100/0x957A53A994860BE4750810131d9c876b2f52d6E1');
uri.searchParams.append('action', 'submit');
uri.searchParams.append('Contract Address', caipAddress);
uri.searchParams.append('Domain Name', domain);
uri.toString();

*/
