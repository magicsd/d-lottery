// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error Raffle__NotEnoughValueEntered();

contract Raffle {
    uint256 private immutable I_TICKET_PRICE;
    address payable[] private s_players;

    constructor(uint256 _ticketPrice) {
        I_TICKET_PRICE = _ticketPrice;
    }

    function enter() public payable {
        if (msg.value < I_TICKET_PRICE) revert Raffle__NotEnoughValueEntered();

        s_players.push(payable(msg.sender));
    }

    function getTicketPrice() public view returns (uint256) {
        return I_TICKET_PRICE;
    }

    function getPlayer(uint256 _index) public view returns (address) {
        return s_players[_index];
    }

//    function pickWinner() {}
}
