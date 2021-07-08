// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.1;

import "./soul.sol";

contract Mayor {
    // Structs, events, and modifiers

    // Store refund data
    struct Refund {
        uint256 soul;
        address symbol;
    }

    // Data to manage the confirmation
    struct Conditions {
        uint32 quorum;
        uint32 envelopes_casted;
        uint32 envelopes_opened;
    }

    struct AccumulatedVote {
        bool isSet;
        uint32 votes;
        uint256 souls;
    }

    event NewMayor(address _candidate);
    event Tie(address _escrow);
    event EnvelopeCast(address _voter);
    event EnvelopeOpen(address _voter, uint256 _soul, address _symbol);

    // Someone can vote as long as the quorum is not reached
    modifier canVote() {
        require(
            voting_condition.envelopes_casted < voting_condition.quorum,
            "Cannot vote now, voting quorum has been reached"
        );
        _;
    }

    // Envelopes can be opened only after receiving the quorum
    modifier canOpen() {
        require(
            voting_condition.envelopes_casted == voting_condition.quorum,
            "Cannot open an envelope, voting quorum not reached yet"
        );
        _;
    }

    // The outcome of the confirmation can be computed as soon as all the casted envelopes have been opened
    modifier canCheckOutcome() {
        require(
            voting_condition.envelopes_opened == voting_condition.quorum,
            "Cannot check the winner, need to open all the sent envelopes"
        );
        _;
    }

    // Added to prevent further calls of mayor_or_sayonara
    modifier protocolDone() {
        require(protocolEnded == false, "Mayor already confirmed/kicked");
        _;
    }

    // Initialization variables
    mapping(address => AccumulatedVote) public candidates;
    address payable[] public candidatesAddresses;
    address payable public escrow;

    // Used to check the modifier protocolDone
    bool protocolEnded = false;

    // Voting phase variables
    mapping(address => bytes32) envelopes;

    Conditions public voting_condition;

    // Refund phase variables
    mapping(address => Refund) souls;
    address[] voters;

    SOUToken token;

    /// @notice The constructor only initializes internal variables
    /// @param _candidates (address) The address of the mayor candidate
    /// @param _escrow (address) The address of the escrow account
    /// @param _quorum (address) The number of voters required to finalize the confirmation
    constructor(
        address[] memory _candidates,
        address payable _escrow,
        uint32 _quorum,
        SOUToken _token
    ) {
        for (uint32 i = 0; i < _candidates.length; i++) {
            candidates[_candidates[i]] = AccumulatedVote(true, 0, 0);
            candidatesAddresses.push(payable(_candidates[i]));
        }
        escrow = _escrow;
        voting_condition = Conditions({
            quorum: _quorum,
            envelopes_casted: 0,
            envelopes_opened: 0
        });

        token = _token;
    }

    function get_candidates() public view returns (address payable[] memory) {
        return candidatesAddresses;
    }

    /// @notice Store a received voting envelope
    /// @param _envelope The envelope represented as the keccak256 hash of (sigil, symbol, soul)
    function cast_envelope(bytes32 _envelope) public canVote {
        if (envelopes[msg.sender] == 0x0) {
            // => NEW, update on 17/05/2021
            voting_condition.envelopes_casted++;
            token.mint(msg.sender);
        }

        envelopes[msg.sender] = _envelope;

        emit EnvelopeCast(msg.sender);
    }

    /// @notice Open an envelope and store the vote information
    /// @param _sigil (uint) The secret sigil of a voter
    /// @param _symbol (address) The voting preference
    /// @param _souls (uint) Amount of souls to transfer
    /// @dev The soul is sent as ERC20 token
    /// @dev Need to recompute the hash to validate the envelope previously casted
    function open_envelope(
        uint256 _sigil,
        address _symbol,
        uint256 _souls
    ) public canOpen {
        // TODO Complete this function

        require(
            envelopes[msg.sender] != 0x0,
            "The sender has not casted any votes"
        );

        bytes32 _casted_envelope = envelopes[msg.sender];

        bytes32 _sent_envelope = compute_envelope(_sigil, _symbol, _souls);

        require(
            _casted_envelope == _sent_envelope,
            "Sent envelope does not correspond to the one casted"
        );

        voting_condition.envelopes_opened++;
        voters.push(msg.sender);
        candidates[_symbol].souls += _souls;
        candidates[_symbol].votes++;

        token.transferFrom(msg.sender, address(this), _souls * 10**18);

        souls[msg.sender] = Refund({soul: _souls, symbol: _symbol});

        emit EnvelopeOpen(msg.sender, _souls, _symbol);

        envelopes[msg.sender] = 0x0;
    }

    /// @notice Either confirm or kick out the candidate. Refund the electors who voted for the losing outcome
    function mayor_or_sayonara() public canCheckOutcome protocolDone {
        bool _winner = true;
        address payable _mayor = candidatesAddresses[0];
        uint256 _soulsToMayor = candidates[_mayor].souls;
        uint256 _soulsToEscrow = candidates[_mayor].souls;
        candidates[_mayor].souls = 0;

        for (uint256 i = 1; i < candidatesAddresses.length; i++) {
            AccumulatedVote memory _candidateResult = candidates[
                candidatesAddresses[i]
            ];

            if (
                _candidateResult.souls > candidates[_mayor].souls ||
                ((_candidateResult.souls == candidates[_mayor].souls) &&
                    (_candidateResult.votes > candidates[_mayor].votes))
            ) {
                _soulsToMayor = _candidateResult.souls;
                _mayor = candidatesAddresses[i];
                _winner = true;
            } else if (
                (_candidateResult.souls == candidates[_mayor].souls) &&
                (_candidateResult.votes == candidates[_mayor].votes)
            ) {
                _winner = false;
            }

            _soulsToEscrow += _candidateResult.souls;
        }

        if (_winner) {
            uint256 _val;
            for (uint256 i = 0; i < voters.length; i++) {
                _val = souls[voters[i]].soul;
                souls[voters[i]].soul = 0;

                if (souls[voters[i]].symbol != _mayor) {
                    token.transfer(voters[i], _val * 10**18);
                }
            }

            protocolEnded = true;
            token.transfer(_mayor, _soulsToMayor * 10**18);
            emit NewMayor(_mayor);
        } else {
            protocolEnded = true;
            token.transfer(escrow, _soulsToEscrow * 10**18);
            emit Tie(escrow);
        }
        // emit the NewMayor() event if the candidate is confirmed as mayor
        // emit the Sayonara() event if the candidate is NOT confirmed as mayor
    }

    /// @notice Compute a voting envelope
    /// @param _sigil (uint) The secret sigil of a voter
    /// @param _symbol (address) The voting preference
    /// @param _soul (uint) The soul associated to the vote
    function compute_envelope(
        uint256 _sigil,
        address _symbol,
        uint256 _soul
    ) public view returns (bytes32) {
        require(
            candidates[_symbol].isSet,
            "The candidate specified does not exist"
        );

        return keccak256(abi.encode(_sigil, _symbol, _soul));
    }
}
