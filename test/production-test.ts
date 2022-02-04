import { expect } from "chai"
import { contractConfig } from '../hardhat.config'
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { Contract } from "ethers"
import { Donation } from "../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { TransactionResponse } from "@ethersproject/abstract-provider"

describe("Production", function () {

	let donation: Donation

	async function getContract(name: string): Promise<Contract> {
		let deployment = await deployments.fixture(["ProductionTest"])
		var contract = deployment[name]
		return ethers.getContractAt(contract.abi, contract.address)
	}

	async function impersonate(account: string): Promise<SignerWithAddress> {
		await ethers.provider.send("hardhat_impersonateAccount", [account]);
		return ethers.getSigner(account)
	}

	async function sendEth(ether: number, address: string): Promise<TransactionResponse> {
		const accounts = await ethers.getSigners()
		const signer = accounts[0]
		return signer.sendTransaction({ to: address, value: ethers.utils.parseEther(ether.toString()) })
	}

	beforeEach(async () => {
		donation = await getContract(contractConfig.contractName) as Donation
	})

	it("Should fail with OnlyOwner after transfer", async function () {
		const onlyOwner = "Ownable: caller is not the owner"
		// Even deployer should fail
		await expect(donation.updateDonationLimits(1, 2)).to.be.revertedWith(onlyOwner)
		await expect(donation.withdraw()).to.be.revertedWith(onlyOwner)
		// Hacker should also continue to fail
		const { hacker } = await getNamedAccounts()
		const impersonatedSigner = await impersonate(hacker)
		await expect(donation.connect(impersonatedSigner).updateDonationLimits(1, 2)).to.be.revertedWith(onlyOwner)
		await expect(donation.connect(impersonatedSigner).withdraw()).to.be.revertedWith(onlyOwner)
	})

	it("Should succeed with new owner", async function () {
		const { finalOwner } = await getNamedAccounts()
		await sendEth(1, finalOwner)
		const impersonatedSigner = await impersonate(finalOwner)
		await donation.connect(impersonatedSigner).updateDonationLimits(1, 2)
		await donation.connect(impersonatedSigner).withdraw()
	})
})
