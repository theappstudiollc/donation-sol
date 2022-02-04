import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { contractConfig, gasConfig } from '../hardhat.config'
import { Donation } from '../typechain-types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const { ethers, network, deployments, getNamedAccounts } = hre
	const { log } = deployments
	const { deployer, finalOwner } = await getNamedAccounts()

	if (finalOwner === null || finalOwner === undefined || finalOwner.length == 0) {
		throw Error(`Invalid final owner: ${finalOwner}`)
	}

	log(`Attaching to '${contractConfig.contractName}' in ${network.name} with the account: ${deployer}`)
	let deployment = await deployments.get(contractConfig.contractName)
	const contract = await ethers.getContractAt(deployment.abi, deployment.address) as Donation

	log(` - attached to '${deployment.address}'\nTransferring owner to ${finalOwner}...`)
	await contract.transferOwnership(finalOwner, {
		gasLimit: 50000, // Take this from unit tests with gasReporter
		maxFeePerGas: ethers.utils.parseUnits(gasConfig.gasFeeGwei, "gwei"),
		maxPriorityFeePerGas: ethers.utils.parseUnits(gasConfig.gasPriorityGwei, "gwei")
	})
}

export default func
func.tags = ['all', 'ProductionTest', 'Production']
