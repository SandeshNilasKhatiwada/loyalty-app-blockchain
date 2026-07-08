// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoyalToken is ERC20, Ownable {
    address public merchant;

    constructor(
        string memory name,
        string memory symbol,
        address _merchant
    ) ERC20(name, symbol) Ownable(msg.sender) {
        merchant = _merchant;
        transferOwnership(_merchant);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
