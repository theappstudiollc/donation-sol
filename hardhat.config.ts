import * as dotenv from "dotenv"

import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-solhint"
import "@nomiclabs/hardhat-waffle"
import "@typechain/hardhat"
import "hardhat-deploy"
import "hardhat-gas-reporter"
import "solidity-coverage"

dotenv.config()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

export const gasConfig = {
	gasToWaitGwei: "76", // Block Gas limit to wait for
	gasFeeGwei: "100", // Ceiling for deployment (should be larger than wait)
	gasPriorityGwei: "2.5", // Ceiling for deployment (don't let another 342 priorty slip through)
}

export const contractConfig = {
	contractName: "Donation",
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 const config: HardhatUserConfig = {
	solidity: {
		compilers: [
			{
				version: "0.8.11",
				settings: {
					optimizer: { enabled: true }
				}
			}
		]
	},
	namedAccounts: {
		deployer: 0,
		hacker: 1,
		donor: 2,
		finalOwner: process.env.FINAL_OWNER!,
	},
	networks: {
		hardhat: {
			chainId: 1337,
		},
		mainnet: {
			url: process.env.MAINNET_RPC_URL,
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
			saveDeployments: true,
		},
		rinkeby: {
			url: process.env.RINKEBY_RPC_URL,
			accounts:
				process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
			saveDeployments: true,
		},
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS !== undefined,
		currency: "USD",
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
}

export default config
