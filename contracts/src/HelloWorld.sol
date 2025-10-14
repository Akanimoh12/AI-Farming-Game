// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Ultra simple contract for testing Somnia deployment
contract HelloWorld {
    string public message = "Hello Somnia!";
    
    function setMessage(string memory _message) public {
        message = _message;
    }
}
