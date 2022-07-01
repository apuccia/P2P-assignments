# P2P-assignments

## Midterm

The assignment requires building a small tool to monitor and analyse which peers
contribute, and how much, to the download of a content form the IPFS network. The
goals of the assignment are to download large files from the IPFS, to query the
bitswap agent to get the CIDs of the partners in order to know how much they
contribute. Optionally it was required to detect the location of these peers around the
globe, this task has been implemented using an external geolocation API called
*ipapi.co*.

The tool is written in Python and it exploits HTTP calls to interact with the API
provided by the agent. It consists of 2 modules and a main. The modules implement
utilities functions used for plotting and requesting services to the API.

## Finalterm

The goal of the assignment was to implement the functions *mayor_or_sayonara*
and *open_envelope* of the smart contract *mayor.sol*, providing some gas estimations/measurements of all the
functions of the contract and security considerations about these two functions. 
The assignment was done using the Truffle framework and Ganache.

## Final project

The project required first to modify the initial smart contract provided for the final term, and that implements a voting system, in two parts:

- In the first part, instead of considering one candidate, the smart contract has to consider one or more candidates.
- The second part consists of implementing a different way in which the souls are awarded to candidates/electors OR implementation of the soul as an ERC20 token OR considering coalitions of candidates. For the second part, I choose to implement the soul as an ERC20 token.

The next task was to provide a DAPP (I choose to implement it in React) to interact with the functionalities offered by the contract.
