/* eslint-disable */
// index.ts
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { InstallButton } from '../components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getSnaps } from '../utils';

const Body = styled.div`
  background-color: ${(props) => props.theme.colors.background.default};
  font-family: Arial, sans-serif;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 4rem;
  margin-bottom: 4rem;
  padding: 2rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const SearchInput = styled.input`
  font-size: 2rem;
  width: 50%;
  padding-left: 5%;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: 0px 0px 10px #ddd;
  height: 100%;
  flex: 1;
`;

const Subtext = styled.p`
  font-size: 1rem;
  color: #888;
`;

const SearchResultList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-top: 2rem;
  width: 80%;
  box-shadow: 0px 0px 10px #ddd;
  border-radius: 10px;
  background-color: #fff;
`;

const SearchResultItem = styled.li`
  padding: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
  cursor: pointer;
`;

const VerifiedBadge = styled.span`
  color: purple;
  margin-left: 0.5rem;
`;

const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  height: 5rem;
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [packages, setPackages] = useState<any[]>([]); // Add explicit type
  const [search, setSearch] = useState<string>('');
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]); // Add explicit type
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.post(
        "https://gateway.thegraph.com/api/b027176e14f0a073a572abe9068dd266/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8",
        {
          query: `
          {
            litems(first:1000, where:{registry:"0xfdb66ad9576842945431c27fe8cb5ef8ed5cb8bb", status_in:[Registered], disputed:false})
          {
              itemID
              metadata {
                key0
                key1
                key2
              }
            }
          }
        `,
        },
      );

      setPackages(response.data.data.litems);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filterPackages = async () => {
      const results = await axios.get(
        `https://registry.npmjs.org/-/v1/search?text=${search}`,
      );
      setFilteredPackages(
        results.data.objects.map((obj: { package: any }) => obj.package),
      );
    };

    if (search) {
      filterPackages();
    } else {
      setFilteredPackages([]);
    }
  }, [search]);

  const handlePackageClick = (packageName: string) => {
    setSelectedPackage(packageName);
    setSearch(packageName); // Set the search input to the selected package name
    setFilteredPackages([]); // Clear the filtered packages array
  };

  const handleConnectClick = async () => {
    const defaultSnapOrigin = `npm:{selectedPackage}`;

    try {
      await connectSnap(defaultSnapOrigin);
      const installedSnap = await getSnaps();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  return (
    <Body>
      <Container>
        <Heading>
          Explore Metamask Snaps, <Span>verified by Kleros</Span>
        </Heading>
        <SearchBarContainer>
          <SearchInput
            type="text"
            placeholder="@kleros/scout-snap"
            value={search}
            onChange={(error) => setSearch(error.target.value)}
          />
          <InstallButton
            onClick={handleConnectClick}
            snapsNpmName={selectedPackage}
            disabled={!selectedPackage}
          >
            Install {selectedPackage} Snap
          </InstallButton>
        </SearchBarContainer>
        <Subtext>
          Results with ✅ are successfully registered on{' '}
          <a href="https://curate.kleros.io/tcr/100/0xfdB66aD9576842945431c27fe8cB5ef8ed5Cb8BB">
            this registry
          </a>{' '}
          on Kleros Curate.
        </Subtext>
        <SearchResultList>
          {filteredPackages.map((pkg) => {
            const isVerified = packages.some((item) => item?.metadata?.key0 === pkg.name);
            return (
              <SearchResultItem
                key={pkg.name}
                onClick={() => handlePackageClick(pkg.name)}
              >
                {pkg.name}
                {isVerified && <VerifiedBadge>✅</VerifiedBadge>}
              </SearchResultItem>
            );
          })}
        </SearchResultList>
      </Container>
    </Body>
  );
};

export default Index;
