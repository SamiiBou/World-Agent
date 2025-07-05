import { appendFileSync, existsSync, writeFileSync } from "fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const { address } = privateKeyToAccount(privateKey);
console.log({
  address
});

// Write private key to .env file
const envContent = `PRIVATE_KEY=${privateKey}
ADDRESS=${address}
`;

try {
  if (existsSync('.env')) {
    console.log('.env file already exists. Appending private key...');
    // Append to existing .env file
    appendFileSync('.env', `
PRIVATE_KEY=${privateKey}
ADDRESS=${address}
`);
  } else {
    console.log('Creating new .env file...');
    writeFileSync('.env', envContent);
  }
  console.log('Private key and address have been added to .env file');
} catch (error) {
  console.error('Error writing to .env file:', error);
}

