// used to test contract requires
require("chai").use(require("chai-as-promised")).should();

const { assert } = require("chai");
// used to test contract events
const truffleAssert = require("truffle-assertions");

const Mayor = artifacts.require("Mayor");
const SOUToken = artifacts.require("SOUToken");

CANVOTE_ERROR_MSG = "Cannot vote now, voting quorum has been reached";
CANOPEN_ERROR_MSG = "Cannot open an envelope, voting quorum not reached yet";
NOTCASTED_ERROR_MSG = "The sender has not casted any votes";
WRONGENV_ERROR_MSG = "Sent envelope does not correspond to the one casted";
CANCHECK_ERROR_MSG =
  "Cannot check the winner, need to open all the sent envelopes";
PROTODONE_ERROR_MSG = "Mayor already confirmed/kicked";
CANDIDATE_ERROR_MSG = "The candidate specified does not exist";

contract("MayorTest", (accounts) => {
  describe("Test constructor", function () {
    it("Should create correct contract", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 10, token.address);
      console.log("Contract address is " + mayor.address);

      const candidate = await mayor.candidates_info(accounts[3]);
      assert(
        candidate.souls == 0 && candidate.votes == 0,
        "Votes: " + candidate.votes + " Souls: " + candidate.souls
      );

      const escrow = await mayor.escrow();
      assert.equal(escrow, accounts[1], "Escrow address is " + escrow);
    });
  });

  describe("Test get_candidates", function () {
    it("Should return array of candidates", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 0, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      candidates = await mayor.get_candidates();
      console.log("The candidates are " + candidates);

      for (var i = 0; i < accounts.length; i++) {
        assert.equal(
          candidates[i],
          accounts[i],
          "The candidate is " + candidates[i]
        );
      }
    });
  });

  describe("Test compute_envelope", function () {
    it("Should hash sigil, vote and soul", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 0, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[3], 50);
      console.log("Envelope hash is " + envelope);

      const encoded = web3.eth.abi.encodeParameters(
        ["uint", "address", "uint"],
        [sigil, accounts[3], 50]
      );
      const hash = web3.utils.sha3(encoded, { encoding: "hex" });
      console.log("Web3 hash is " + hash);

      assert.equal(
        envelope,
        hash,
        "Envelope hash is " + envelope + ", Web3 hash is " + hash
      );
    });

    it("Should not create the envelope because the specified address is not a candidate", async function () {
      const candidates = accounts.slice(0, 5);

      const token = await SOUToken.new();
      const mayor = await Mayor.new(candidates, accounts[9], 0, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor
        .compute_envelope(sigil, accounts[8], 50)
        .should.be.rejectedWith(CANDIDATE_ERROR_MSG);
    });
  });

  describe("Test cast_envelope", function () {
    it("Should not cast envelope because quorum is reached", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 0, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[3], 50);

      await mayor
        .cast_envelope(envelope, { from: accounts[2] })
        .should.be.rejectedWith(CANVOTE_ERROR_MSG);
    });

    it("Should cast envelope because quorum is not reached", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 5, token.address);

      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[3], 50);

      const res = await mayor.cast_envelope(envelope, { from: accounts[2] });

      truffleAssert.eventEmitted(res, "EnvelopeCast", (event) => {
        return event._voter === accounts[2];
      });

      const balance = await token.balanceOf(accounts[2]);
      assert.equal(balance, 100 * 10 ** 18, "Token balance is " + balance);
    });

    it("A voter should not receive more than 100 tokens by casting multiple envelopes", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 5, token.address);

      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[3], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });
      await mayor.cast_envelope(envelope, { from: accounts[2] });
      await token.mint(accounts[2], { from: accounts[2] });

      const balance = await token.balanceOf(accounts[2]);
      assert.equal(balance, 100 * 10 ** 18, "Token balance is " + balance);
    });
  });

  describe("Test open_envelope", function () {
    it("Should not open the envelope because quorum is not reached", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 5, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });

      await mayor
        .open_envelope(sigil, accounts[2], 50, { from: accounts[2] })
        .should.be.rejectedWith(CANOPEN_ERROR_MSG);
    });

    it("Should not open the envelope because the address has not casted yet", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 0, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor
        .open_envelope(sigil, accounts[2], 50, { from: accounts[2] })
        .should.be.rejectedWith(NOTCASTED_ERROR_MSG);
    });

    it("Should not open the envelope because it is not equal to the one casted", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 1, token.address);
      console.log("Contract address is " + mayor.address);

      sigil = Math.floor(Math.random() * 100);
      envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });

      await mayor
        .open_envelope(1234, accounts[4], 50, { from: accounts[2] })
        .should.be.rejectedWith(WRONGENV_ERROR_MSG);
    });

    it("Should increase souls, emit the event, increase the balance of contract", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 1, token.address);

      console.log("Contract address is " + mayor.address);

      const sigil = Math.floor(Math.random() * 100);
      const envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });

      const balanceVoterBefore = await token.balanceOf(accounts[2]);
      const result = await token.approve(mayor.address, 50, {
        from: accounts[2],
      });

      assert(result, "Approval failed");
      const receipt = await mayor.open_envelope(sigil, accounts[2], 50, {
        from: accounts[2],
      });
      const balanceVoterAfter = await token.balanceOf(accounts[2]);

      assert.equal(
        parseInt(balanceVoterAfter) + 50,
        balanceVoterBefore,
        "Must be equal"
      );

      truffleAssert.eventEmitted(receipt, "EnvelopeOpen", (event) => {
        return (
          event._voter === accounts[2] &&
          event._soul == 50 &&
          event._symbol == accounts[2]
        );
      });
      const accumulatedVote = await mayor.candidates_info(accounts[2]);
      assert.equal(
        accumulatedVote.souls,
        50,
        "The souls are " + accumulatedVote.souls
      );
      assert.equal(
        accumulatedVote.votes,
        1,
        "The votes are " + accumulatedVote.votes
      );

      const mayorBalance = await token.balanceOf(mayor.address);
      assert.equal(mayorBalance, 50, "Mayor balance is " + mayorBalance);
    });

    it("Should not open the same envelope multiple times", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 1, token.address);

      console.log("Contract address is " + mayor.address);

      const sigil = Math.floor(Math.random() * 100);
      const envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });

      await token.approve(mayor.address, 50, { from: accounts[2] });

      await mayor.open_envelope(sigil, accounts[2], 50, { from: accounts[2] });

      await mayor
        .open_envelope(sigil, accounts[2], 50, { from: accounts[2] })
        .should.be.rejectedWith(NOTCASTED_ERROR_MSG);
    });
  });

  describe("Test mayor_or_sayonara", function () {
    it("Should not declare the mayor because not all envelopes are opened", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 1, token.address);
      console.log("Contract address is " + mayor.address);

      const sigil = Math.floor(Math.random() * 100);
      const envelope = await mayor.compute_envelope(sigil, accounts[2], 50);

      await mayor.cast_envelope(envelope, { from: accounts[2] });

      await mayor
        .mayor_or_sayonara()
        .should.be.rejectedWith(CANCHECK_ERROR_MSG);
    });

    it("Should elect the candidate and update its balance", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 3, token.address);

      console.log("Contract address is " + mayor.address);

      const sigilVoter1 = Math.floor(Math.random() * 100);
      const envelopeVoter1 = await mayor.compute_envelope(
        sigilVoter1,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter1, { from: accounts[2] });

      const sigilVoter2 = Math.floor(Math.random() * 100);
      const envelopeVoter2 = await mayor.compute_envelope(
        sigilVoter2,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter2, { from: accounts[3] });

      const sigilLoser = Math.floor(Math.random() * 100);
      const envelopeLoser = await mayor.compute_envelope(
        sigilLoser,
        accounts[3],
        100
      );
      await mayor.cast_envelope(envelopeLoser, { from: accounts[4] });

      await token.approve(mayor.address, 100, { from: accounts[2] });
      await mayor.open_envelope(sigilVoter1, accounts[2], 100, {
        from: accounts[2],
      });
      await token.approve(mayor.address, 100, { from: accounts[3] });
      await mayor.open_envelope(sigilVoter2, accounts[2], 100, {
        from: accounts[3],
      });
      await token.approve(mayor.address, 100, { from: accounts[4] });
      await mayor.open_envelope(sigilLoser, accounts[3], 100, {
        from: accounts[4],
      });

      var mayorBalance = await token.balanceOf(mayor.address);
      assert.equal(mayorBalance, 300);
      const cr = await mayor.candidates_info(accounts[2]);
      assert.equal(cr.votes, 2, "Must be equal");
      assert.equal(cr.souls, 200, "Must be equal");

      const balanceEscrowBefore = await token.balanceOf(accounts[1]);
      const balanceLoserBefore = await token.balanceOf(accounts[4]);
      const balanceCandidateBefore = await token.balanceOf(accounts[2]);
      const receipt = await mayor.mayor_or_sayonara({ from: accounts[0] });
      const balanceCandidateAfter = await token.balanceOf(accounts[2]);
      const balanceLoserAfter = await token.balanceOf(accounts[4]);
      const balanceEscrowAfter = await token.balanceOf(accounts[1]);

      console.log("BalanceEscrowBefore " + balanceEscrowBefore);
      console.log("BalanceEscrowAfter " + balanceEscrowAfter);

      console.log("BalanceLoserBefore " + balanceLoserBefore);
      console.log("BalanceLoserAfter " + balanceLoserAfter);

      console.log("BalanceCandidateBefore " + balanceCandidateBefore);
      console.log("BalanceCandidateAfter " + balanceCandidateAfter);

      assert.equal(
        parseInt(balanceEscrowAfter),
        parseInt(balanceEscrowBefore),
        "Must be equal"
      );
      assert.equal(
        parseInt(balanceCandidateAfter) - 200,
        balanceCandidateBefore,
        "Must be equal"
      );
      assert.equal(
        parseInt(balanceLoserAfter) - 100,
        balanceLoserBefore,
        "Must be equal"
      );

      truffleAssert.eventEmitted(receipt, "NewMayor", (event) => {
        return event._candidate === accounts[2];
      });
    });

    it("Should be tie and update escrow", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 4, token.address);
      console.log("Contract address is " + mayor.address);

      const sigilVoter1 = Math.floor(Math.random() * 100);
      const envelopeVoter1 = await mayor.compute_envelope(
        sigilVoter1,
        accounts[2],
        50
      );
      await mayor.cast_envelope(envelopeVoter1, { from: accounts[2] });

      const sigilVoter2 = Math.floor(Math.random() * 100);
      const envelopeVoter2 = await mayor.compute_envelope(
        sigilVoter2,
        accounts[3],
        50
      );
      await mayor.cast_envelope(envelopeVoter2, { from: accounts[3] });

      const sigilVoter3 = Math.floor(Math.random() * 100);
      const envelopeVoter3 = await mayor.compute_envelope(
        sigilVoter3,
        accounts[4],
        100
      );
      await mayor.cast_envelope(envelopeVoter3, { from: accounts[4] });

      const sigilVoter4 = Math.floor(Math.random() * 100);
      const envelopeVoter4 = await mayor.compute_envelope(
        sigilVoter4,
        accounts[5],
        100
      );
      await mayor.cast_envelope(envelopeVoter4, { from: accounts[5] });

      await token.approve(mayor.address, 50, { from: accounts[2] });
      await mayor.open_envelope(sigilVoter1, accounts[2], 50, {
        from: accounts[2],
      });
      await token.approve(mayor.address, 50, { from: accounts[3] });
      await mayor.open_envelope(sigilVoter2, accounts[3], 50, {
        from: accounts[3],
      });
      await token.approve(mayor.address, 100, { from: accounts[4] });
      await mayor.open_envelope(sigilVoter3, accounts[4], 100, {
        from: accounts[4],
      });
      await token.approve(mayor.address, 100, { from: accounts[5] });
      await mayor.open_envelope(sigilVoter4, accounts[5], 100, {
        from: accounts[5],
      });

      const balanceEscrowBefore = await token.balanceOf(accounts[1]);
      const receipt = await mayor.mayor_or_sayonara({ from: accounts[0] });
      const balanceEscrowAfter = await token.balanceOf(accounts[1]);

      console.log("BalanceEscrowBefore " + balanceEscrowBefore);
      console.log("BalanceEscrowAfter " + balanceEscrowAfter);

      assert.equal(
        balanceEscrowAfter - 300,
        balanceEscrowBefore,
        "Must be equal"
      );

      console.log("Escrow address " + accounts[1]);
      truffleAssert.eventEmitted(receipt, "Tie", (event) => {
        return event._escrow === accounts[1];
      });
    });

    it("Should not repeat the mayor_or_sayonara", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 3, token.address);
      console.log("Contract address is " + mayor.address);

      const sigilVoter1 = Math.floor(Math.random() * 100);
      const envelopeVoter1 = await mayor.compute_envelope(
        sigilVoter1,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter1, { from: accounts[2] });

      const sigilVoter2 = Math.floor(Math.random() * 100);
      const envelopeVoter2 = await mayor.compute_envelope(
        sigilVoter2,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter2, { from: accounts[3] });

      const sigilLoser = Math.floor(Math.random() * 100);
      const envelopeLoser = await mayor.compute_envelope(
        sigilLoser,
        accounts[3],
        100
      );
      await mayor.cast_envelope(envelopeLoser, { from: accounts[4] });

      await token.approve(mayor.address, 100, { from: accounts[2] });
      await mayor.open_envelope(sigilVoter1, accounts[2], 100, {
        from: accounts[2],
      });
      await token.approve(mayor.address, 100, { from: accounts[3] });
      await mayor.open_envelope(sigilVoter2, accounts[2], 100, {
        from: accounts[3],
      });
      await token.approve(mayor.address, 100, { from: accounts[4] });
      await mayor.open_envelope(sigilLoser, accounts[3], 100, {
        from: accounts[4],
      });

      await mayor.mayor_or_sayonara({ from: accounts[0] });

      await mayor
        .mayor_or_sayonara({ from: accounts[0] })
        .should.be.rejectedWith(PROTODONE_ERROR_MSG);
    });
  });

  describe("Test mayor_result", function () {
    it("Should be empty befor mayor_or_sayonara", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 3, token.address);

      console.log("Contract address is " + mayor.address);

      const result = await mayor.mayor_result();

      assert.equal(
        result.mayor_address,
        0x0,
        "The address is " + result.mayor_address
      );
      assert.equal(result.result, "", "The result is " + result.result);
    });

    it("Should return result of the voting protocol in case of a winner", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 3, token.address);

      console.log("Contract address is " + mayor.address);

      const sigilVoter1 = Math.floor(Math.random() * 100);
      const envelopeVoter1 = await mayor.compute_envelope(
        sigilVoter1,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter1, { from: accounts[2] });

      const sigilVoter2 = Math.floor(Math.random() * 100);
      const envelopeVoter2 = await mayor.compute_envelope(
        sigilVoter2,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter2, { from: accounts[3] });

      const sigilLoser = Math.floor(Math.random() * 100);
      const envelopeLoser = await mayor.compute_envelope(
        sigilLoser,
        accounts[3],
        100
      );
      await mayor.cast_envelope(envelopeLoser, { from: accounts[4] });

      await token.approve(mayor.address, 100, { from: accounts[2] });
      await mayor.open_envelope(sigilVoter1, accounts[2], 100, {
        from: accounts[2],
      });
      await token.approve(mayor.address, 100, { from: accounts[3] });
      await mayor.open_envelope(sigilVoter2, accounts[2], 100, {
        from: accounts[3],
      });
      await token.approve(mayor.address, 100, { from: accounts[4] });
      await mayor.open_envelope(sigilLoser, accounts[3], 100, {
        from: accounts[4],
      });

      await mayor.mayor_or_sayonara({ from: accounts[0] });

      const result = await mayor.mayor_result();

      assert.equal(
        result.mayor_address,
        accounts[2],
        "The winner is " + result.mayor_address
      );
      assert.equal(result.result, "NewMayor", "The result is " + result.result);
    });

    it("Should return result of the voting protocol in case of a tie", async function () {
      const token = await SOUToken.new();
      const mayor = await Mayor.new(accounts, accounts[1], 2, token.address);

      console.log("Contract address is " + mayor.address);

      const sigilVoter1 = Math.floor(Math.random() * 100);
      const envelopeVoter1 = await mayor.compute_envelope(
        sigilVoter1,
        accounts[2],
        100
      );
      await mayor.cast_envelope(envelopeVoter1, { from: accounts[2] });

      const sigilVoter2 = Math.floor(Math.random() * 100);
      const envelopeVoter2 = await mayor.compute_envelope(
        sigilVoter2,
        accounts[3],
        100
      );
      await mayor.cast_envelope(envelopeVoter2, { from: accounts[3] });

      await token.approve(mayor.address, 100, { from: accounts[2] });
      await mayor.open_envelope(sigilVoter1, accounts[2], 100, {
        from: accounts[2],
      });
      await token.approve(mayor.address, 100, { from: accounts[3] });
      await mayor.open_envelope(sigilVoter2, accounts[3], 100, {
        from: accounts[3],
      });

      await mayor.mayor_or_sayonara({ from: accounts[0] });

      const result = await mayor.mayor_result();

      assert.equal(
        result.mayor_address,
        accounts[1],
        "The escrow account is " + result.mayor_address
      );
      assert.equal(result.result, "Tie", "The result is " + result.result);
    });
  });
});
