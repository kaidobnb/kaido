const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('KaidoLP Token', function () {
  let KaidoLP;
  let kaidoLP;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here
    KaidoLP = await ethers.getContractFactory('KaidoLP');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    kaidoLP = await KaidoLP.deploy();
    await kaidoLP.deployed();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await kaidoLP.owner()).to.equal(owner.address);
    });

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await kaidoLP.balanceOf(owner.address);
      expect(await kaidoLP.totalSupply()).to.equal(ownerBalance);
    });

    it('Should have correct token details', async function () {
      expect(await kaidoLP.name()).to.equal('Kaido LP');
      expect(await kaidoLP.symbol()).to.equal('KAIDO');
      expect(await kaidoLP.decimals()).to.equal(18);
      expect(await kaidoLP.totalSupply()).to.equal(ethers.utils.parseEther('1000000000')); // 1B tokens
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      // Transfer 50 tokens from owner to addr1
      await kaidoLP.transfer(addr1.address, ethers.utils.parseEther('50'));
      const addr1Balance = await kaidoLP.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther('50'));

      // Transfer 50 tokens from addr1 to addr2
      await kaidoLP.connect(addr1).transfer(addr2.address, ethers.utils.parseEther('50'));
      const addr2Balance = await kaidoLP.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther('50'));
    });

    it('Should fail if sender doesn\'t have enough tokens', async function () {
      const initialOwnerBalance = await kaidoLP.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000000 tokens)
      await expect(
        kaidoLP.connect(addr1).transfer(owner.address, ethers.utils.parseEther('1'))
      ).to.be.revertedWith('KaidoLP: transfer amount exceeds balance');

      // Owner balance shouldn't have changed
      expect(await kaidoLP.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it('Should update balances after transfers', async function () {
      const initialOwnerBalance = await kaidoLP.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1
      await kaidoLP.transfer(addr1.address, ethers.utils.parseEther('100'));

      // Transfer another 50 tokens from owner to addr2
      await kaidoLP.transfer(addr2.address, ethers.utils.parseEther('50'));

      // Check balances
      const finalOwnerBalance = await kaidoLP.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(ethers.utils.parseEther('150')));

      const addr1Balance = await kaidoLP.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.utils.parseEther('100'));

      const addr2Balance = await kaidoLP.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.utils.parseEther('50'));
    });
  });

  describe('Presale', function () {
    it('Should have correct initial presale parameters', async function () {
      const presaleInfo = await kaidoLP.getPresaleInfo();
      expect(presaleInfo.active).to.equal(false);
      expect(presaleInfo.price).to.equal(ethers.utils.parseEther('0.0004'));
      expect(presaleInfo.minContrib).to.equal(ethers.utils.parseEther('0.1'));
      expect(presaleInfo.maxContrib).to.equal(ethers.utils.parseEther('35'));
      expect(presaleInfo.totalTokens).to.equal(ethers.utils.parseEther('400000000')); // 40% of 1B
      expect(presaleInfo.soldTokens).to.equal(0);
    });

    it('Should allow owner to start presale', async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 86400; // 24 hours later
      const price = ethers.utils.parseEther('0.0004');

      await kaidoLP.startPresale(startTime, endTime, price);

      const presaleInfo = await kaidoLP.getPresaleInfo();
      expect(presaleInfo.active).to.equal(true);
      expect(presaleInfo.startTime).to.equal(startTime);
      expect(presaleInfo.endTime).to.equal(endTime);
      expect(presaleInfo.price).to.equal(price);
    });

    it('Should not allow non-owner to start presale', async function () {
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 86400;
      const price = ethers.utils.parseEther('0.0002');

      await expect(
        kaidoLP.connect(addr1).startPresale(startTime, endTime, price)
      ).to.be.revertedWith('KaidoLP: caller is not the owner');
    });

    it('Should allow presale participation when active', async function () {
      // Start presale
      const startTime = Math.floor(Date.now() / 1000) - 100; // Started 100 seconds ago
      const endTime = startTime + 86400; // 24 hours from start
      const price = ethers.utils.parseEther('0.0004');

      await kaidoLP.startPresale(startTime, endTime, price);

      // Participate in presale
      const contribution = ethers.utils.parseEther('1'); // 1 BNB
      await kaidoLP.connect(addr1).participateInPresale({ value: contribution });

      // Check participant info
      const participantInfo = await kaidoLP.getParticipantInfo(addr1.address);
      expect(participantInfo.isParticipant).to.equal(true);
      expect(participantInfo.contribution).to.equal(contribution);

      // Check token balance
      const expectedTokens = contribution.div(price).mul(ethers.utils.parseEther('1'));
      const balance = await kaidoLP.balanceOf(addr1.address);
      expect(balance).to.equal(expectedTokens);
    });
  });

  describe('Pause functionality', function () {
    it('Should allow owner to pause and unpause', async function () {
      expect(await kaidoLP.paused()).to.equal(false);

      await kaidoLP.pause();
      expect(await kaidoLP.paused()).to.equal(true);

      await kaidoLP.unpause();
      expect(await kaidoLP.paused()).to.equal(false);
    });

    it('Should prevent transfers when paused', async function () {
      await kaidoLP.pause();

      await expect(
        kaidoLP.transfer(addr1.address, ethers.utils.parseEther('100'))
      ).to.be.revertedWith('KaidoLP: token transfer while paused');
    });

    it('Should not allow non-owner to pause', async function () {
      await expect(
        kaidoLP.connect(addr1).pause()
      ).to.be.revertedWith('KaidoLP: caller is not the owner');
    });
  });
});
