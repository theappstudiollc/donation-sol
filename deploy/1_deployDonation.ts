import { contractConfig, gasConfig } from '../hardhat.config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	// Need to use the hardhat-deploy function for deployment to gain all of the benefits

	const { ethers, network, deployments, getNamedAccounts } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	const maxFee = ethers.utils.parseUnits(gasConfig.gasFeeGwei, "gwei")
	const maxPriority = ethers.utils.parseUnits(gasConfig.gasPriorityGwei, "gwei")
	log(`Deploying ${contractConfig.contractName} to ${network.name} for ${gasConfig.gasFeeGwei}+${gasConfig.gasPriorityGwei} Gwei with the account: ${deployer}`)
	var balance = await ethers.provider.getBalance(deployer);
	log(` - Account balance: ${ethers.utils.formatUnits(balance, "ether")} ETH`)

	// Deploy the Donation contract
	await deploy(contractConfig.contractName, { from: deployer, log: true, maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority })

	log(`Deployed. Verify with:\n\tnpx hardhat etherscan-verify --network ${network.name}`)
}

export default func
func.tags = ['all', 'Donation', 'ProductionTest', 'Production']
