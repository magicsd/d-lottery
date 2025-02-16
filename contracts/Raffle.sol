// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

error Raffle__NotEnoughValueEntered();

contract Raffle is VRFConsumerBaseV2 {
    uint256 private immutable I_TICKET_PRICE;
    address payable[] private s_players;

    event Enter(address indexed player);

    constructor(address _vrfCoordinatorV2, uint256 _ticketPrice) VRFConsumerBaseV2(_vrfCoordinatorV2) {
        I_TICKET_PRICE = _ticketPrice;
    }

    function enter() public payable {
        if (msg.value < I_TICKET_PRICE) revert Raffle__NotEnoughValueEntered();

        s_players.push(payable(msg.sender));

        emit Enter(msg.sender);
    }

    function requestRandomWinner() external {}

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {

    }

    function getTicketPrice() public view returns (uint256) {
        return I_TICKET_PRICE;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }
}
