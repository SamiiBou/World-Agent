# Script to create Properties and Types

1. First run `pnpm create-private-key` to create a private key and address in the .env file
2. Take the address and enter it in Faucet to get some testnet ETH [https://faucet.conduit.xyz/geo-test-zc16z3tcvf](https://faucet.conduit.xyz/geo-test-zc16z3tcvf)
3. Update the code in `index.ts` to create the properties and types you want to create
4. Run `pnpm create-types` to create the properties and types
5. Query the Indexer API to verify your type exists. Replace the logged ID from the type of the `index.ts` script. see [https://v2-postgraphile.up.railway.app/graphql?query=%7B%0A++type%28id%3A+%22f47ac10b-58cc-4372-a567-0e02b2c3d479%22%29+%7B%0A++++name%0A++%7D%0A%7D](https://v2-postgraphile.up.railway.app/graphql?query=%7B%0A++type%28id%3A+%22f47ac10b-58cc-4372-a567-0e02b2c3d479%22%29+%7B%0A++++name%0A++%7D%0A%7D).
