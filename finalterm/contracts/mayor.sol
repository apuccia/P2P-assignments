// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.1;

contract Mayor {
    
    // Structs, events, and modifiers
    
    // Store refund data
    struct Refund {
        uint soul;
        bool doblon;
    }
    
    // Data to manage the confirmation
    struct Conditions {
        uint32 quorum;
        uint32 envelopes_casted;
        uint32 envelopes_opened;
    }
    
    event NewMayor(address _candidate);
    event Sayonara(address _escrow);
    event EnvelopeCast(address _voter);
    event EnvelopeOpen(address _voter, uint _soul, bool _doblon);
    
    // Someone can vote as long as the quorum is not reached
    modifier canVote() {
        require(voting_condition.envelopes_casted < voting_condition.quorum, "Cannot vote now, voting quorum has been reached");
        _;   
    }
    
    // Envelopes can be opened only after receiving the quorum
    modifier canOpen() {
        require(voting_condition.envelopes_casted == voting_condition.quorum, "Cannot open an envelope, voting quorum not reached yet");
        _;
    }
    
    // The outcome of the confirmation can be computed as soon as all the casted envelopes have been opened
    modifier canCheckOutcome() {
        require(voting_condition.envelopes_opened == voting_condition.quorum, "Cannot check the winner, need to open all the sent envelopes");
        _;
    }

    // Added to prevent further calls of mayor_or_sayonara
    modifier protocolDone() {
        require(protocolEnded == false, "Mayor already confirmed/kicked");
        _;
    }
    
    // State attributes
    
    // Initialization variables
    address payable public candidate;
    address payable public escrow;

    // Used to check the modifier protocolDone
    bool protocolEnded = false;
    
    // Voting phase variables
    mapping(address => bytes32) envelopes;

    Conditions voting_condition;

    uint public naySoul;
    uint public yaySoul;

    // Added to keep track of the results during the opening
    uint yayVote;
    uint nayVote;

    // Refund phase variables
    mapping(address => Refund) souls;
    address[] voters;

    /// @notice The constructor only initializes internal variables
    /// @param _candidate (address) The address of the mayor candidate
    /// @param _escrow (address) The address of the escrow account
    /// @param _quorum (address) The number of voters required to finalize the confirmation
    constructor(address payable _candidate, address payable _escrow, uint32 _quorum) {
        candidate = _candidate;
        escrow = _escrow;
        voting_condition = Conditions({quorum: _quorum, envelopes_casted: 0, envelopes_opened: 0});
    }


    /// @notice Store a received voting envelope
    /// @param _envelope The envelope represented as the keccak256 hash of (sigil, doblon, soul) 
    function cast_envelope(bytes32 _envelope) canVote public {
        if(envelopes[msg.sender] == 0x0) // => NEW, update on 17/05/2021
            voting_condition.envelopes_casted++;

        envelopes[msg.sender] = _envelope;
        emit EnvelopeCast(msg.sender);
    }
    
    
    /// @notice Open an envelope and store the vote information
    /// @param _sigil (uint) The secret sigil of a voter
    /// @param _doblon (bool) The voting preference
    /// @dev The soul is sent as crypto
    /// @dev Need to recompute the hash to validate the envelope previously casted
    function open_envelope(uint _sigil, bool _doblon) canOpen public payable {
        
        // TODO Complete this function

        require(envelopes[msg.sender] != 0x0, "The sender has not casted any votes");
        
        bytes32 _casted_envelope = envelopes[msg.sender];
        
        uint _soul = msg.value;
        bytes32 _sent_envelope = compute_envelope(_sigil, _doblon, _soul);

        require(_casted_envelope == _sent_envelope, "Sent envelope does not correspond to the one casted");
        
        voting_condition.envelopes_opened++;
        voters.push(msg.sender);
        if (_doblon) {
            yaySoul += _soul;
            yayVote++;
        }
        else {
            naySoul += _soul;
            nayVote++;
        }
        
        souls[msg.sender] = Refund({
            soul: _soul,
            doblon: _doblon
        });
        
        emit EnvelopeOpen(msg.sender, _soul, _doblon);
    }
    
    
    /// @notice Either confirm or kick out the candidate. Refund the electors who voted for the losing outcome
    function mayor_or_sayonara() canCheckOutcome protocolDone public {
        bool _confirmed = false;
        
        if (yayVote > nayVote) {
            _confirmed = true;
        }
        
        uint _val;
        for (uint i = 0; i < voters.length; i ++) {
            _val = souls[voters[i]].soul;
            souls[voters[i]].soul = 0;

            if (souls[voters[i]].doblon != _confirmed) {
                if (_confirmed) {
                    naySoul -= _val;
                }
                else {
                    yaySoul -= _val;
                }

                payable(voters[i]).transfer(_val);
            }
        }
        
        if (_confirmed){
            _val = yaySoul;
            yaySoul = 0;
            protocolEnded = true;
            candidate.transfer(_val);
            emit NewMayor(candidate);
        }
        else{
            _val = naySoul;
            naySoul = 0;
            protocolEnded = true;
            escrow.transfer(_val);
            emit Sayonara(escrow);
        }
            // emit the NewMayor() event if the candidate is confirmed as mayor
            // emit the Sayonara() event if the candidate is NOT confirmed as mayor        
    }
 
 
    /// @notice Compute a voting envelope
    /// @param _sigil (uint) The secret sigil of a voter
    /// @param _doblon (bool) The voting preference
    /// @param _soul (uint) The soul associated to the vote
    function compute_envelope(uint _sigil, bool _doblon, uint _soul) public pure returns(bytes32) {
        return keccak256(abi.encode(_sigil, _doblon, _soul));
    }
    
}