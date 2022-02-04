import { expect } from "chai"
import { contractConfig } from '../hardhat.config'
import { ethers, deployments, getNamedAccounts } from "hardhat"
import { BigNumber, Contract } from "ethers"
import { Donation } from "../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

describe("Donation", function () {

	const defaultCause = "unit test cause"
	const specialCause = "special cause"
	let donation: Donation
	let maximumDonation: BigNumber
	let minimumDonation: BigNumber

	async function getContract(name: string): Promise<Contract> {
		let deployment = await deployments.fixture(["Donation"])
		var contract = deployment[name]
		return ethers.getContractAt(contract.abi, contract.address)
	}

	async function impersonate(account: string): Promise<SignerWithAddress> {
		await ethers.provider.send("hardhat_impersonateAccount", [account]);
		return ethers.getSigner(account)
	}

	beforeEach(async () => {
		donation = await getContract(contractConfig.contractName) as Donation
		maximumDonation = await donation.maximumDonation()
		minimumDonation = await donation.minimumDonation()
	})

	it("Should revert with InvalidCause", async function () {
		let shortCause = ""
		let longCause = "123456789012345678901234567890123"
		await expect(donation.donate(shortCause, { value: minimumDonation })).to.be.revertedWith("InvalidCause")
		await expect(donation.donate(longCause, { value: minimumDonation })).to.be.revertedWith("InvalidCause")
		await expect(donation.donationsForCause(shortCause)).to.be.revertedWith("InvalidCause")
		await expect(donation.donationsForCause(longCause)).to.be.revertedWith("InvalidCause")
	})

	it("Should revert with InvalidDonationAmount", async function () {
		await expect(donation.donate(defaultCause)).to.be.revertedWith("InvalidDonationAmount")
		await expect(donation.donate(defaultCause, { value: maximumDonation.add(1) })).to.be.revertedWith("InvalidDonationAmount")
		await expect(donation.donate(defaultCause, { value: minimumDonation.sub(1) })).to.be.revertedWith("InvalidDonationAmount")
	})

	it("Should revert with InvalidLimitsSpecified", async function () {
		await expect(donation.updateDonationLimits(maximumDonation, minimumDonation)).to.be.revertedWith("InvalidLimitsSpecified")
	})

	it("Should fail with OnlyOwner", async function () {
		const onlyOwner = "Ownable: caller is not the owner"
		const { hacker } = await getNamedAccounts()
		const impersonatedSigner = await impersonate(hacker)
		await expect(donation.connect(impersonatedSigner).updateDonationLimits(1, 2)).to.be.revertedWith(onlyOwner)
		await expect(donation.connect(impersonatedSigner).withdraw()).to.be.revertedWith(onlyOwner)
	})

	it("Should succeed with donation", async function () {
		await donation.donate(defaultCause, { value: maximumDonation })
		await donation.donate(defaultCause, { value: minimumDonation })
	})

	it("Should emit DonatedToCause", async function () {
		const eventName = "DonatedToCause"
		const { deployer, donor } = await getNamedAccounts() // These accounts will have money
		expect(await donation.donate(defaultCause, { value: maximumDonation }))
			.to.emit(donation, eventName).withArgs(deployer, maximumDonation, defaultCause);
		const impersonatedSigner = await impersonate(donor)
		expect(await donation.connect(impersonatedSigner).donate(specialCause, { value: minimumDonation }))
			.to.emit(donation, eventName).withArgs(donor, minimumDonation, specialCause);
	})

	it("Should pause and resume donations", async function () {
		// Set donations limits to zero and ensure that all donations fail
		await donation.updateDonationLimits(0, 0)
		await expect(donation.donate(defaultCause)).to.be.revertedWith("InvalidDonationAmount")
		await expect(donation.donate(defaultCause, { value: maximumDonation })).to.be.revertedWith("InvalidDonationAmount")
		await expect(donation.donate(defaultCause, { value: minimumDonation })).to.be.revertedWith("InvalidDonationAmount")
		// Restore original limits and ensure donations behave correctly
		await donation.updateDonationLimits(minimumDonation, maximumDonation)
		await expect(donation.donate(defaultCause)).to.be.revertedWith("InvalidDonationAmount")
		await donation.donate(defaultCause, { value: maximumDonation })
		await donation.donate(defaultCause, { value: minimumDonation })
	})

	it("Should return correct collected donation", async function () {
		expect(await donation.donationsForCause(defaultCause)).to.be.equal(BigNumber.from(0))
		expect(await donation.donationsForCause(specialCause)).to.be.equal(BigNumber.from(0))
		await donation.donate(defaultCause, { value: maximumDonation })
		expect(await donation.donationsForCause(defaultCause)).to.be.equal(maximumDonation)
		expect(await donation.donationsForCause(specialCause)).to.be.equal(BigNumber.from(0))
		await donation.donate(defaultCause, { value: minimumDonation })
		expect(await donation.donationsForCause(defaultCause)).to.be.equal(maximumDonation.add(minimumDonation))
		expect(await donation.donationsForCause(specialCause)).to.be.equal(BigNumber.from(0))
		await donation.withdraw()
		expect(await donation.donationsForCause(defaultCause)).to.be.equal(BigNumber.from(0))
		expect(await donation.donationsForCause(specialCause)).to.be.equal(BigNumber.from(0))
		await donation.donate(specialCause, { value: minimumDonation })
		expect(await donation.donationsForCause(defaultCause)).to.be.equal(BigNumber.from(0))
		expect(await donation.donationsForCause(specialCause)).to.be.equal(minimumDonation)
	})

	it("Should update donation limits", async function () {
		expect(minimumDonation.eq(ethers.utils.parseEther("0.01")), "0.01").to.be.true
		expect(maximumDonation.eq(ethers.utils.parseEther("10")), "10").to.be.true
		await donation.updateDonationLimits(minimumDonation.sub(minimumDonation), maximumDonation.add(minimumDonation))
		let newMinimum = await donation.minimumDonation()
		expect(newMinimum.eq(ethers.utils.parseEther("0")), "0").to.be.true
		let newMaximum = await donation.maximumDonation()
		expect(newMaximum.eq(ethers.utils.parseEther("10.01")), "10.01").to.be.true
	})

	it("Should emit DonationLimitUpdated", async function () {
		const eventName = "DonationLimitUpdated"
		let newMinimum = minimumDonation.sub(minimumDonation)
		let newMaximum = maximumDonation.add(minimumDonation)
		expect(await donation.updateDonationLimits(newMinimum, newMaximum))
		.to.emit(donation, eventName).withArgs(newMinimum, newMaximum);
	})

	it("Should withdraw all donations", async function () {
		// Donate a valid donation amount
		await donation.donate(defaultCause, { value: maximumDonation.add(minimumDonation).div(2) })
		// Capture the current owner's balance and withdraw
		const owner = await donation.owner()
		var balance = await ethers.provider.getBalance(owner);
		await donation.withdraw() // This incurs a gas cost on the owner
		// Verify balances and collected fees
		var updatedBalance = await ethers.provider.getBalance(owner)
		expect(updatedBalance.gt(balance)).to.be.true
	})

	it("Should emit DonationsWithdrawn", async function () {
		const eventName = "DonationsWithdrawn"
		await donation.donate(defaultCause, { value: maximumDonation })
		expect(await donation.withdraw()).to.emit(donation, eventName).withArgs(maximumDonation);
	})
})
