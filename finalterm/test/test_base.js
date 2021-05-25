// used to test contract requires
require('chai')
.use(require('chai-as-promised'))
.should();

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

const Mayor = artifacts.require("Mayor");

CANVOTE_ERROR_MSG = "Cannot vote now, voting quorum has been reached";
CANOPEN_ERROR_MSG = "Cannot open an envelope, voting quorum not reached yet";
NOTCASTED_ERROR_MSG = "The sender has not casted any votes";
WRONGENV_ERROR_MSG = "Sent envelope does not correspond to the one casted";
CANCHECK_ERROR_MSG = "Cannot check the winner, need to open all the sent envelopes";

contract("MayorTest", accounts => {
    describe("Test constructor", function() {
        it("Should create correct contract", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 0);
            console.log("Contract address is" + mayor.address);

            const candidate = await mayor.candidate();
            assert.equal(candidate, accounts[0], "Candidate address is " + candidate);

            const escrow = await mayor.escrow();
            assert.equal(escrow, accounts[1], "Escrow address is " + escrow);
        });
    });

    describe("Test compute_envelope", function() {
        it("Should hash sigil, vote and soul", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);
            console.log("Envelope hash is " + envelope);

            const encoded = web3.eth.abi.encodeParameters(['uint', 'bool', 'uint'], [sigil, true, 50]);
            const hash = web3.utils.sha3(encoded, {encoding: 'hex'});
            console.log("Web3 hash is " + hash);

            assert.equal(envelope, hash, "Envelope hash is " + envelope + ", Web3 hash is " + hash);
        });
    });

    describe("Test cast_envelope", function() {
        it("Should not cast envelope because quorum is reached", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]}).should.be.rejectedWith(CANVOTE_ERROR_MSG);
        });

        it("Shoul cast envelope because quorum is not reached", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 5);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);

            const res = await mayor.cast_envelope(envelope, {from: accounts[2]});

            truffleAssert.eventEmitted(res, "EnvelopeCast", (event) => {
                return event._voter === accounts[2];
            });
        });
    });

    describe("Test open_envelope", function() {
        it("Should not open the envelope because quorum is not reached", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 5);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const res = await mayor.open_envelope(sigil, true, {from: accounts[2]}).should.be.rejectedWith(CANOPEN_ERROR_MSG);
        });

        it("Should not open the envelope because the address has not casted yet", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);

            const res = await mayor.open_envelope(sigil, true, {from: accounts[2]}).should.be.rejectedWith(NOTCASTED_ERROR_MSG);
        });

        it("Should not open the envelope because it is not equal to the one casted", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, true, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const res = await mayor.open_envelope(1234, false, {from: accounts[2]}).should.be.rejectedWith(WRONGENV_ERROR_MSG);
        });

        it("Should increase yaySouls, emit the event, increase the balance of contract", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            const sigil = Math.floor(Math.random() * 100);
            const envelope = await mayor.compute_envelope(sigil, true, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const balanceVoterBefore = await web3.eth.getBalance(accounts[2]); 
            const receipt = await mayor.open_envelope(sigil, true, {from: accounts[2], value: 50});
            const balanceVoterAfter = await web3.eth.getBalance(accounts[2]);

            const gasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasTotalPrice = parseInt(tx.gasPrice) * gasUsed;

            assert.equal(parseInt(balanceVoterAfter) + gasTotalPrice + 50, parseInt(balanceVoterBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "EnvelopeOpen", (event) => {
                return event._voter === accounts[2] && event._soul == 50 && event._doblon == true;
            });

            const souls = await mayor.yaySoul();
            assert.equal(souls, 50, "The yaySouls are " + souls);

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 50, "Mayor balance is " + mayorBalance);
        });

        it("Should increase naySouls, emit the event, increase the balance of contract", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            const sigil = Math.floor(Math.random() * 100);
            const envelope = await mayor.compute_envelope(sigil, false, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const balanceVoterBefore = await web3.eth.getBalance(accounts[2]); 
            const receipt = await mayor.open_envelope(sigil, false, {from: accounts[2], value: 50});
            const balanceVoterAfter = await web3.eth.getBalance(accounts[2]);

            const gasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasTotalPrice = parseInt(tx.gasPrice) * gasUsed;

            assert.equal(parseInt(balanceVoterAfter) + gasTotalPrice + 50, parseInt(balanceVoterBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "EnvelopeOpen", (event) => {
                return event._voter === accounts[2] && event._soul == 50 && event._doblon == false;
            });

            const souls = await mayor.naySoul();
            assert.equal(souls, 50, "The naySouls are " + souls);

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 50, "Mayor balance is " + mayorBalance);
        });
    });

    describe("Test mayor_or_sayonara", function() {
        it("Should not declare the mayor because not all envelopes are opened", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            const sigil = Math.floor(Math.random() * 100);
            const envelope = await mayor.compute_envelope(sigil, true, 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            await mayor.mayor_or_sayonara().should.be.rejectedWith(CANCHECK_ERROR_MSG);
        });

        it("Should confirm the candidate and update its balance", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 3);
            console.log("Contract address is " + mayor.address);

            const sigilConfirmed1 = Math.floor(Math.random() * 100);
            const envelopeConfirmed1 = await mayor.compute_envelope(sigilConfirmed1, true, 50);
            await mayor.cast_envelope(envelopeConfirmed1, {from: accounts[2]});

            const sigilConfirmed2 = Math.floor(Math.random() * 100);
            const envelopeConfirmed2 = await mayor.compute_envelope(sigilConfirmed2, true, 50);
            await mayor.cast_envelope(envelopeConfirmed2, {from: accounts[3]});

            const sigilKicked = Math.floor(Math.random() * 100);
            const envelopeKicked = await mayor.compute_envelope(sigilKicked, false, 100);
            await mayor.cast_envelope(envelopeKicked, {from: accounts[4]});

            await mayor.open_envelope(sigilConfirmed1, true, {from: accounts[2], value: 50});
            await mayor.open_envelope(sigilConfirmed2, true, {from: accounts[3], value: 50});
            await mayor.open_envelope(sigilKicked, false, {from: accounts[4], value: 100});

            const balanceEscrowBefore = await web3.eth.getBalance(accounts[1]); 
            const balanceLoserBefore = await web3.eth.getBalance(accounts[4]); 
            const balanceCandidateBefore = await web3.eth.getBalance(accounts[0]); 
            const receipt = await mayor.mayor_or_sayonara();
            const balanceCandidateAfter = await web3.eth.getBalance(accounts[0]);
            const balanceLoserAfter = await web3.eth.getBalance(accounts[4]);
            const balanceEscrowAfter = await web3.eth.getBalance(accounts[1]);  

            const gasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasTotalPrice = parseInt(tx.gasPrice) * gasUsed;

            assert.equal(balanceEscrowAfter, balanceEscrowBefore, "Must be equal");
            assert.equal(parseInt(balanceCandidateAfter) + gasTotalPrice + 100, parseInt(balanceCandidateBefore), "Must be equal");
            assert.equal(parseInt(balanceLoserAfter) - 100, parseInt(balanceLoserBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "NewMayor", (event) => {
                return event._candidate === accounts[0];
            });

            const yaySouls = await mayor.yaySoul();
            assert.equal(yaySouls.toNumber(), 0, "yaySoul is " + yaySouls);
    
            const naySouls = await mayor.naySoul();
            assert.equal(naySouls.toNumber(), 0, "naySoul is " + naySouls);

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 0, "Mayor balance is " + mayorBalance);
        });

        it("Should not confirm the candidate and update its balance", async function () {
            const mayor = await Mayor.new(accounts[0], accounts[1], 3);
            console.log("Contract address is " + mayor.address);

            const sigilConfirmed = Math.floor(Math.random() * 100);
            const envelopeConfirmed = await mayor.compute_envelope(sigilConfirmed, true, 50);
            await mayor.cast_envelope(envelopeConfirmed, {from: accounts[2]});

            const sigilKicked1 = Math.floor(Math.random() * 100);
            const envelopeKicked1 = await mayor.compute_envelope(sigilKicked1, false, 50);
            await mayor.cast_envelope(envelopeKicked1, {from: accounts[3]});

            const sigilKicked2 = Math.floor(Math.random() * 100);
            const envelopeKicked2 = await mayor.compute_envelope(sigilKicked2, false, 100);
            await mayor.cast_envelope(envelopeKicked2, {from: accounts[4]});

            await mayor.open_envelope(sigilConfirmed, true, {from: accounts[2], value: 50});
            await mayor.open_envelope(sigilKicked1, false, {from: accounts[3], value: 50});
            await mayor.open_envelope(sigilKicked2, false, {from: accounts[4], value: 100});

            const balanceEscrowBefore = await web3.eth.getBalance(accounts[1]); 
            const balanceLoserBefore = await web3.eth.getBalance(accounts[4]); 
            const balanceCandidateBefore = await web3.eth.getBalance(accounts[0]); 
            const receipt = await mayor.mayor_or_sayonara();
            const balanceCandidateAfter = await web3.eth.getBalance(accounts[0]);
            const balanceLoserAfter = await web3.eth.getBalance(accounts[4]);
            const balanceEscrowAfter = await web3.eth.getBalance(accounts[1]); 

            const gasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasTotalPrice = parseInt(tx.gasPrice) * gasUsed;

            assert.equal(parseInt(balanceEscrowAfter) + 100, parseInt(balanceEscrowBefore), "Must be equal");
            assert.equal(parseInt(balanceCandidateAfter) + gasTotalPrice, parseInt(balanceCandidateBefore), "Must be equal");
            assert.equal(parseInt(balanceLoserAfter) - 100, parseInt(balanceLoserBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "Sayonara", (event) => {
                return event._escrow === accounts[1];
            });

            const yaySouls = await mayor.yaySoul();
            assert.equal(yaySouls.toNumber(), 0, "yaySoul is " + yaySouls);
    
            const naySouls = await mayor.naySoul();
            assert.equal(naySouls.toNumber(), 0, "naySoul is " + naySouls);

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 0, "Mayor balance is " + mayorBalance);
        });
    });
});