import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { BigNumber } from 'ethers'
import { gasConfig } from '../hardhat.config'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const { ethers, deployments, getNamedAccounts } = hre
	const { log } = deployments
	const { deployer } = await getNamedAccounts()

	var balance = await ethers.provider.getBalance(deployer);
	log(`Account balance: ${ethers.utils.formatUnits(balance, "ether")} ETH`)

	const checkFee = ethers.utils.parseUnits(gasConfig.gasToWaitGwei, "gwei") // When to attempt deploy
	log(` - Waiting for gas under ${ethers.utils.formatUnits(checkFee, "gwei")} Gwei`)
	while (await shouldDeployNow(ethers, checkFee) == false) {
		await new Promise(r => setTimeout(r, 7500))
	}
}

async function shouldDeployNow(ethers: any, desiredGas: BigNumber): Promise<boolean> {
	let latestBlock = await ethers.provider.getBlock("latest")
	if (typeof latestBlock.baseFeePerGas === 'object' && latestBlock.baseFeePerGas !== null) {
		let baseFeePerGas = ethers.utils.formatUnits(latestBlock.baseFeePerGas, "gwei")
		console.log(`Block ${latestBlock.number} base fee = ${baseFeePerGas} Gwei ${new Date()}`)
		if (desiredGas.gte(latestBlock.baseFeePerGas)) {
			return true
		}
	}
	return false
}

export default func
func.tags = ['all', 'Production']
