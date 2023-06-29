# Kleros Scout Snap

This Snap pulls contract metadata from Kleros's decentralized token curated registries to provide insights to the contract you are interacting with.

## Publication to NPM

1. Bump the version in `package.json`
1. Run a clean build: `yarn clean && yarn build`
1. Commit the change to git: `git add -u ; git commit -m "chore: release"`
1. Tag this version: `version=v$(cat package.json | jq -r .version) && git tag -m $version $version`
1. Push both commit and tag: `git push && git push --tags`
1. Export your NPM token: `export YARN_NPM_AUTH_TOKEN=<npm_xxxxxxxxxxxx>`
1. Publish: `yarn publish`

## Notes

- This is an beta version of this Snap and is still going through constant iteration.
- The data used in this Snap is pulled from the following decentralized registries on Kleros Curate:
  - [Contract-Domain Name Registry](https://curate.kleros.io/tcr/100/0x957a53a994860be4750810131d9c876b2f52d6e1)
  - [Address Tags Registry](https://curate.kleros.io/tcr/100/0x66260c69d03837016d88c9877e61e08ef74c59f2)
  - [Tokens Registry](https://curate.kleros.io/tcr/100/0x70533554fe5c17caf77fe530f77eab933b92af60)
