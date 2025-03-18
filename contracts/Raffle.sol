// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {VRFCoordinatorV2_5} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFCoordinatorV2_5.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

error Raffle__NotEnoughValueEntered();
error Raffle__TransferFailed();
error Raffle__RaffleClosed();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 playersCount, uint256 raffleState);

/** @title A sample Raffle Contract
 * @author Aleksandr Dus
 * @notice This contract is for creating a sample raffle contract.
 * @dev This implements Chainlink VRF and Chainlink Automation interfaces.
 */
contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    enum RaffleState {
        Open,
        Calculating
    }

    uint256 private immutable I_TICKET_PRICE;
    address private immutable I_OWNER;
    address payable[] private s_players;
    VRFCoordinatorV2_5 private immutable I_COORDINATOR;
    bytes32 private immutable I_GAS_LANE;
    uint256 private immutable I_SUBSCRIPTION_ID;
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

    constructor(
        uint256 _subscriptionId,
        address _vrfCoordinatorV2,
        uint256 _ticketPrice,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2Plus(_vrfCoordinatorV2) {
        I_SUBSCRIPTION_ID = _subscriptionId;
        I_TICKET_PRICE = _ticketPrice;
        I_OWNER = msg.sender;
        I_COORDINATOR = VRFCoordinatorV2_5(_vrfCoordinatorV2);
        I_GAS_LANE = _gasLane;
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

    function checkUpkeep(
        bytes memory /* checkData */
    ) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = s_raffleState == RaffleState.Open;
        bool isTimePassed = (block.timestamp - s_lastTimestamp) > I_INTERVAL;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;

        upkeepNeeded = isOpen && isTimePassed && hasPlayers && hasBalance;
    }

    function performUpkeep(bytes calldata /* performData */) external override onlyOwner {
        (bool upkeepNeeded, ) = checkUpkeep("");

        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }

        s_raffleState = RaffleState.Calculating;

        uint256 requestId = I_COORDINATOR.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: I_GAS_LANE,
                subId: I_SUBSCRIPTION_ID,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: I_CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    // Set nativePayment to true to pay for VRF requests with Sepolia ETH instead of LINK
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );

        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 /* _requestId, */, uint256[] calldata _randomWords) internal override {
        uint256 winnerIndex = _randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
        s_recentWinner = recentWinner;

        s_raffleState = RaffleState.Open;
        s_players = new address payable[](0);
        s_lastTimestamp = block.timestamp;

        (bool isSuccess, ) = recentWinner.call{value: address(this).balance}("");

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

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getWordsCount() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimestamp() public view returns (uint256) {
        return s_lastTimestamp;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return I_INTERVAL;
    }
}
