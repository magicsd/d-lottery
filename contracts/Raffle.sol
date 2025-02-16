// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

    error Raffle__NotEnoughValueEntered();
    error Raffle__NotOwner();

contract Raffle is VRFConsumerBaseV2 {
    uint256 private immutable I_TICKET_PRICE;
    address private immutable I_OWNER;
    address payable[] private s_players;
    bytes32 private immutable I_GAS_LANE;
    uint64 private immutable I_SUBSCRIPTION_ID;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable I_CALLBACK_GAS_LIMIT;
    uint32 private constant NUM_WORDS = 1;

    VRFCoordinatorV2Interface private immutable I_COORDINATOR;

    event Enter(address indexed player);

    modifier onlyOwner() {
        if (msg.sender != I_OWNER) revert Raffle__NotOwner();
        _;
    }

    constructor(
        address _vrfCoordinatorV2,
        uint256 _ticketPrice,
        bytes32 _gasLane,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        I_TICKET_PRICE = _ticketPrice;
        I_OWNER = msg.sender;
        I_COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        I_GAS_LANE = _gasLane;
        I_SUBSCRIPTION_ID = _subscriptionId;
        I_CALLBACK_GAS_LIMIT = _callbackGasLimit;
    }

    function enter() public payable {
        if (msg.value < I_TICKET_PRICE) revert Raffle__NotEnoughValueEntered();

        s_players.push(payable(msg.sender));

        emit Enter(msg.sender);
    }

    function requestRandomWinner() external onlyOwner returns (address winner) {
        uint256 requestId = I_COORDINATOR.requestRandomWords(
            I_GAS_LANE,
            I_SUBSCRIPTION_ID,
            REQUEST_CONFIRMATIONS,
            I_CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {

    }

    function getTicketPrice() public view returns (uint256) {
        return I_TICKET_PRICE;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }
}
