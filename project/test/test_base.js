// used to test contract requires
require('chai')
.use(require('chai-as-promised'))
.should();

const { assert } = require('chai');
// used to test contract events
const truffleAssert = require("truffle-assertions");

const Mayor = artifacts.require("Mayor");

CANVOTE_ERROR_MSG = "Cannot vote now, voting quorum has been reached";
CANOPEN_ERROR_MSG = "Cannot open an envelope, voting quorum not reached yet";
NOTCASTED_ERROR_MSG = "The sender has not casted any votes";
WRONGENV_ERROR_MSG = "Sent envelope does not correspond to the one casted";
CANCHECK_ERROR_MSG = "Cannot check the winner, need to open all the sent envelopes";
PROTODONE_ERROR_MSG = "Mayor already confirmed/kicked";
CANDIDATE_ERROR_MSG = "The candidate specified does not exist";

contract("MayorTest", accounts => {
    describe("Test constructor", function() {
        it("Should create correct contract", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            const candidate = await mayor.candidates(accounts[3]);
            assert(candidate.souls == 0 && candidate.votes == 0, "Votes: " + candidate.votes + " Souls: " + candidate.souls);

            const escrow = await mayor.escrow();
            assert.equal(escrow, accounts[1], "Escrow address is " + escrow);
        });
    });

    
    describe("Test compute_envelope", function() {
        it("Should hash sigil, vote and soul", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[3], 50);
            console.log("Envelope hash is " + envelope);

            const encoded = web3.eth.abi.encodeParameters(['uint', 'address', 'uint'], [sigil, accounts[3], 50]);
            const hash = web3.utils.sha3(encoded, {encoding: 'hex'});
            console.log("Web3 hash is " + hash);

            assert.equal(envelope, hash, "Envelope hash is " + envelope + ", Web3 hash is " + hash);
        });

        it("Should not create the envelope because the specified address is not a candidate", async function () {
            const candidates = accounts.slice(0, 5);
            
            const mayor = await Mayor.new(candidates, accounts[9], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[8], 50).should.be.rejectedWith(CANDIDATE_ERROR_MSG);;
        });
    });

    
    describe("Test cast_envelope", function() {
        it("Should not cast envelope because quorum is reached", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[3], 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]}).should.be.rejectedWith(CANVOTE_ERROR_MSG);
        });

        it("Should cast envelope because quorum is not reached", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 5);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[3], 50);

            const res = await mayor.cast_envelope(envelope, {from: accounts[2]});

            truffleAssert.eventEmitted(res, "EnvelopeCast", (event) => {
                return event._voter === accounts[2];
            });
        });
    });

    
    describe("Test open_envelope", function() {
        it("Should not open the envelope because quorum is not reached", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 5);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const res = await mayor.open_envelope(sigil, accounts[2], {from: accounts[2]}).should.be.rejectedWith(CANOPEN_ERROR_MSG);
        });

        it("Should not open the envelope because the address has not casted yet", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 0);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

            const res = await mayor.open_envelope(sigil, accounts[2], {from: accounts[2]}).should.be.rejectedWith(NOTCASTED_ERROR_MSG);
        });

        it("Should not open the envelope because it is not equal to the one casted", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            sigil = Math.floor(Math.random() * 100);
            envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const res = await mayor.open_envelope(1234, accounts[4], {from: accounts[2]}).should.be.rejectedWith(WRONGENV_ERROR_MSG);
        });

        it("Should increase souls, emit the event, increase the balance of contract", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            const sigil = Math.floor(Math.random() * 100);
            const envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            const balanceVoterBefore = await web3.eth.getBalance(accounts[2]); 
            const receipt = await mayor.open_envelope(sigil, accounts[2], {from: accounts[2], value: 50});
            const balanceVoterAfter = await web3.eth.getBalance(accounts[2]);

            console.log(receipt.receipt);

            const gasUsed = receipt.receipt.gasUsed;
            const tx = await web3.eth.getTransaction(receipt.tx);
            const gasTotalPrice = parseInt(tx.gasPrice) * gasUsed;

            console.log(tx);

            console.log("BalanceVoterBefore " + balanceVoterBefore);
            console.log("Total gas cost " + gasTotalPrice);
            console.log("BalanceVoterAfter " + balanceVoterAfter);

            assert(BigInt(balanceVoterAfter) + BigInt(gasTotalPrice) + BigInt(50) == BigInt(balanceVoterBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "EnvelopeOpen", (event) => {
                return event._voter === accounts[2] && event._soul == 50 && event._symbol == accounts[2];
            });
            const accumulatedVote = await mayor.candidates(accounts[2]);
            assert.equal(accumulatedVote.souls, 50, "The souls are " + accumulatedVote.souls);
            assert.equal(accumulatedVote.votes, 1, "The votes are " + accumulatedVote.votes);

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 50, "Mayor balance is " + mayorBalance);
        });
    });

    
    describe("Test mayor_or_sayonara", function() {
        it("Should not declare the mayor because not all envelopes are opened", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 1);
            console.log("Contract address is " + mayor.address);

            const sigil = Math.floor(Math.random() * 100);
            const envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

            await mayor.cast_envelope(envelope, {from: accounts[2]});

            await mayor.mayor_or_sayonara().should.be.rejectedWith(CANCHECK_ERROR_MSG);
        });

        
        it("Should elect the candidate and update its balance", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 3);
            console.log("Contract address is " + mayor.address);

            const sigilVoter1 = Math.floor(Math.random() * 100);
            const envelopeVoter1 = await mayor.compute_envelope(sigilVoter1, accounts[2], 100);
            await mayor.cast_envelope(envelopeVoter1, {from: accounts[2]});

            const sigilVoter2 = Math.floor(Math.random() * 100);
            const envelopeVoter2 = await mayor.compute_envelope(sigilVoter2, accounts[2], 100);
            await mayor.cast_envelope(envelopeVoter2, {from: accounts[3]});

            const sigilLoser = Math.floor(Math.random() * 100);
            const envelopeLoser = await mayor.compute_envelope(sigilLoser, accounts[3], 100);
            await mayor.cast_envelope(envelopeLoser, {from: accounts[4]});

            await mayor.open_envelope(sigilVoter1, accounts[2], {from: accounts[2], value: 100});
            await mayor.open_envelope(sigilVoter2, accounts[2], {from: accounts[3], value: 100});
            await mayor.open_envelope(sigilLoser, accounts[3], {from: accounts[4], value: 100});

            const cr = await mayor.candidates(accounts[2]);
            assert.equal(cr.votes, 2, "Must be equal");
            assert.equal(cr.souls, 200, "Must be equal");

            const balanceEscrowBefore = await web3.eth.getBalance(accounts[1]); 
            const balanceLoserBefore = await web3.eth.getBalance(accounts[4]); 
            const balanceCandidateBefore = await web3.eth.getBalance(accounts[2]); 
            const receipt = await mayor.mayor_or_sayonara({from: accounts[0]});
            const balanceCandidateAfter = await web3.eth.getBalance(accounts[2]);
            const balanceLoserAfter = await web3.eth.getBalance(accounts[4]);
            const balanceEscrowAfter = await web3.eth.getBalance(accounts[1]); 
            
            console.log("BalanceEscrowBefore " + balanceEscrowBefore);
            console.log("BalanceEscrowAfter " + balanceEscrowAfter);

            console.log("BalanceLoserBefore " + balanceLoserBefore);
            console.log("BalanceLoserAfter " + balanceLoserAfter);

            console.log("BalanceCandidateBefore " + balanceCandidateBefore);
            console.log("BalanceCandidateAfter " + balanceCandidateAfter);

            assert.equal(balanceEscrowAfter, balanceEscrowBefore, "Must be equal");
            assert(BigInt(balanceCandidateAfter) - BigInt(200) == BigInt(balanceCandidateBefore), "Must be equal");
            assert(BigInt(balanceLoserAfter) - BigInt(100) == BigInt(balanceLoserBefore), "Must be equal");

            truffleAssert.eventEmitted(receipt, "NewMayor", (event) => {
                return event._candidate === accounts[2];
            });

            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 0, "Mayor balance is " + mayorBalance);
        });

        
        it("Should be tie and update escrow", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 4);
            console.log("Contract address is " + mayor.address);

            const sigilVoter1 = Math.floor(Math.random() * 100);
            const envelopeVoter1 = await mayor.compute_envelope(sigilVoter1, accounts[2], 100);
            await mayor.cast_envelope(envelopeVoter1, {from: accounts[2]});

            const sigilVoter2 = Math.floor(Math.random() * 100);
            const envelopeVoter2 = await mayor.compute_envelope(sigilVoter2, accounts[3], 100);
            await mayor.cast_envelope(envelopeVoter2, {from: accounts[3]});

            const sigilVoter3 = Math.floor(Math.random() * 100);
            const envelopeVoter3 = await mayor.compute_envelope(sigilVoter3, accounts[4], 200);
            await mayor.cast_envelope(envelopeVoter3, {from: accounts[4]});

            const sigilVoter4 = Math.floor(Math.random() * 100);
            const envelopeVoter4 = await mayor.compute_envelope(sigilVoter4, accounts[5], 200);
            await mayor.cast_envelope(envelopeVoter4, {from: accounts[5]});
 
            await mayor.open_envelope(sigilVoter1, accounts[2], {from: accounts[2], value: 100});
            await mayor.open_envelope(sigilVoter2, accounts[3], {from: accounts[3], value: 100});
            await mayor.open_envelope(sigilVoter3, accounts[4], {from: accounts[4], value: 200});
            await mayor.open_envelope(sigilVoter4, accounts[5], {from: accounts[5], value: 200});

            const balanceEscrowBefore = await web3.eth.getBalance(accounts[1]);
            const receipt = await mayor.mayor_or_sayonara({from: accounts[0]});
            const balanceEscrowAfter = await web3.eth.getBalance(accounts[1]); 

            console.log("BalanceEscrowBefore " + balanceEscrowBefore);
            console.log("BalanceEscrowAfter " + balanceEscrowAfter);

            assert((BigInt(balanceEscrowAfter) - BigInt(600)) == BigInt(balanceEscrowBefore), "Must be equal");
            
            console.log("Escrow address " + accounts[1]);
            truffleAssert.eventEmitted(receipt, "Tie", (event) => {
                return event._escrow === accounts[1];
            });
            
            const mayorBalance = await web3.eth.getBalance(mayor.address);
            assert.equal(mayorBalance, 0, "Mayor balance is " + mayorBalance);
        });

        
        it("Should not repeat the mayor_or_sayonara", async function () {
            const mayor = await Mayor.new(accounts, accounts[1], 3);
            console.log("Contract address is " + mayor.address);

            const sigilVoter1 = Math.floor(Math.random() * 100);
            const envelopeVoter1 = await mayor.compute_envelope(sigilVoter1, accounts[2], 100);
            await mayor.cast_envelope(envelopeVoter1, {from: accounts[2]});

            const sigilVoter2 = Math.floor(Math.random() * 100);
            const envelopeVoter2 = await mayor.compute_envelope(sigilVoter2, accounts[2], 100);
            await mayor.cast_envelope(envelopeVoter2, {from: accounts[3]});

            const sigilLoser = Math.floor(Math.random() * 100);
            const envelopeLoser = await mayor.compute_envelope(sigilLoser, accounts[3], 100);
            await mayor.cast_envelope(envelopeLoser, {from: accounts[4]});

            await mayor.open_envelope(sigilVoter1, accounts[2], {from: accounts[2], value: 100});
            await mayor.open_envelope(sigilVoter2, accounts[2], {from: accounts[3], value: 100});
            await mayor.open_envelope(sigilLoser, accounts[3], {from: accounts[4], value: 100});

            await mayor.mayor_or_sayonara({from: accounts[0]});

            await mayor.mayor_or_sayonara({from: accounts[0]}).should.be.rejectedWith(PROTODONE_ERROR_MSG);
        });
    });
});