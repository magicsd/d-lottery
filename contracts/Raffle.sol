// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

    error Raffle__NotEnoughValueEntered();
    error Raffle__NotOwner();
    error Raffle__TransferFailed();
    error Raffle__RaffleClosed();

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    enum RaffleState {Open, Calculating}

    uint256 private immutable I_TICKET_PRICE;
    address private immutable I_OWNER;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable I_COORDINATOR;
    bytes32 private immutable I_GAS_LANE;
    uint64 private immutable I_SUBSCRIPTION_ID;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable I_CALLBACK_GAS_LIMIT;
    uint32 private constant NUM_WORDS = 1;

    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimestamp;
    uint256 private immutable I_INTERVAL;

    event Enter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    modifier onlyOwner() {
        if (msg.sender != I_OWNER) revert Raffle__NotOwner();
        _;
    }

    constructor(
        address _vrfCoordinatorV2,
        uint256 _ticketPrice,
        bytes32 _gasLane,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        I_TICKET_PRICE = _ticketPrice;
        I_OWNER = msg.sender;
        I_COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        I_GAS_LANE = _gasLane;
        I_SUBSCRIPTION_ID = _subscriptionId;
        I_CALLBACK_GAS_LIMIT = _callbackGasLimit;
        s_raffleState = RaffleState.Open;
        s_lastTimestamp = block.timestamp;
        I_INTERVAL = _interval;
    }

    function enter() public payable {
        if (s_raffleState != RaffleState.Open) revert Raffle__RaffleClosed();
        if (msg.value < I_TICKET_PRICE) revert Raffle__NotEnoughValueEntered();

        s_players.push(payable(msg.sender));

        emit Enter(msg.sender);
    }

    function requestRandomWinner() external onlyOwner {
        s_raffleState = RaffleState.Calculating;

        uint256 requestId = I_COORDINATOR.requestRandomWords(
            I_GAS_LANE,
            I_SUBSCRIPTION_ID,
            REQUEST_CONFIRMATIONS,
            I_CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        emit RequestedRaffleWinner(requestId);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = s_raffleState == RaffleState.Open;
        bool isTimePassed = (block.timestamp - s_lastTimestamp) > I_INTERVAL;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;

        upkeepNeeded = isOpen && isTimePassed && hasPlayers && hasBalance;
    }

    function performUpkeep(bytes calldata /* p erformData */) external override {}

    function fulfillRandomWords(
        uint256, /* _requestId, */
        uint256[] memory _randomWords
    ) internal override {
        uint256 winnerIndex = _randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;

        s_raffleState = RaffleState.Open;

        s_players = new address payable[](0);

        (bool isSuccess,) = recentWinner.call{value: address(this).balance}('');

        if (!isSuccess) revert Raffle__TransferFailed();

        emit WinnerPicked(recentWinner);
    }

    function getTicketPrice() public view returns (uint256) {
        return I_TICKET_PRICE;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}
