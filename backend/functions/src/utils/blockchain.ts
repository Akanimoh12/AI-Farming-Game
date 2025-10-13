/**
 * Blockchain interaction utilities using ethers.js
 */

import { ethers } from "ethers";
import { getConfig } from "./config";
import { createError, ErrorCode } from "./errors";
import { ContractABIs, ContractName, ContractAddresses } from "../types/contracts";
import * as functions from "firebase-functions";

let providerInstance: ethers.JsonRpcProvider | null = null;
let walletInstance: ethers.Wallet | null = null;

/**
 * Get ethers provider instance
 */
export const getProvider = (): ethers.JsonRpcProvider => {
  if (!providerInstance) {
    const config = getConfig();
    providerInstance = new ethers.JsonRpcProvider(config.somnia.rpcUrl, {
      chainId: config.somnia.chainId,
      name: "somnia",
    });
  }
  return providerInstance;
};

/**
 * Get admin wallet instance
 */
export const getAdminWallet = (): ethers.Wallet => {
  if (!walletInstance) {
    const config = getConfig();
    const provider = getProvider();
    walletInstance = new ethers.Wallet(config.admin.privateKey, provider);
  }
  return walletInstance;
};

/**
 * Get contract instance
 */
export const getContract = (
  contractName: ContractName,
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract => {
  const config = getConfig();
  const address = config.contracts[contractName];
  const abi = ContractABIs[contractName];
  const providerOrSigner = signerOrProvider || getProvider();

  return new ethers.Contract(address, abi, providerOrSigner);
};

/**
 * Get all contract addresses
 */
export const getContractAddresses = (): ContractAddresses => {
  const config = getConfig();
  return config.contracts;
};

/**
 * Verify wallet signature
 */
export const verifySignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    functions.logger.error("Signature verification failed:", error);
    return false;
  }
};

/**
 * Normalize Ethereum address (lowercase)
 */
export const normalizeAddress = (address: string): string => {
  return ethers.getAddress(address).toLowerCase();
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Format token amount from wei to readable units
 */
export const formatTokenAmount = (
  amount: bigint | string,
  decimals: number = 18
): string => {
  return ethers.formatUnits(amount, decimals);
};

/**
 * Parse token amount from readable units to wei
 */
export const parseTokenAmount = (
  amount: string,
  decimals: number = 18
): bigint => {
  return ethers.parseUnits(amount, decimals);
};

/**
 * Wait for transaction confirmation
 */
export const waitForTransaction = async (
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    functions.logger.error("Transaction wait failed:", { txHash, error });
    throw createError(
      ErrorCode.TRANSACTION_FAILED,
      "Transaction confirmation failed",
      { txHash }
    );
  }
};

/**
 * Get transaction receipt
 */
export const getTransactionReceipt = async (
  txHash: string
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    return await provider.getTransactionReceipt(txHash);
  } catch (error) {
    functions.logger.error("Failed to get transaction receipt:", { txHash, error });
    return null;
  }
};

/**
 * Get current block number
 */
export const getCurrentBlockNumber = async (): Promise<number> => {
  try {
    const provider = getProvider();
    return await provider.getBlockNumber();
  } catch (error) {
    functions.logger.error("Failed to get block number:", error);
    throw createError(ErrorCode.BLOCKCHAIN_ERROR, "Failed to query blockchain");
  }
};

/**
 * Get user's token balance
 */
export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string
): Promise<bigint> => {
  try {
    const provider = getProvider();
    const tokenABI = ["function balanceOf(address) view returns (uint256)"];
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
    return await tokenContract.balanceOf(userAddress);
  } catch (error) {
    functions.logger.error("Failed to get token balance:", { tokenAddress, userAddress, error });
    throw createError(ErrorCode.CONTRACT_CALL_FAILED, "Failed to query token balance");
  }
};

/**
 * Get user's NFT token IDs
 */
export const getUserNFTs = async (
  nftAddress: string,
  userAddress: string
): Promise<string[]> => {
  try {
    const provider = getProvider();
    const nftABI = [
      "function balanceOf(address) view returns (uint256)",
      "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
    ];
    const nftContract = new ethers.Contract(nftAddress, nftABI, provider);

    const balance = await nftContract.balanceOf(userAddress);
    const tokenIds: string[] = [];

    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
      tokenIds.push(tokenId.toString());
    }

    return tokenIds;
  } catch (error) {
    functions.logger.error("Failed to get NFTs:", { nftAddress, userAddress, error });
    throw createError(ErrorCode.CONTRACT_CALL_FAILED, "Failed to query NFT ownership");
  }
};

/**
 * Estimate gas for transaction
 */
export const estimateGas = async (
  contract: ethers.Contract,
  method: string,
  args: any[]
): Promise<bigint> => {
  try {
    return await contract[method].estimateGas(...args);
  } catch (error) {
    functions.logger.error("Gas estimation failed:", { method, args, error });
    throw createError(ErrorCode.CONTRACT_CALL_FAILED, "Failed to estimate gas");
  }
};

/**
 * Parse contract events from transaction receipt
 */
export const parseContractEvents = (
  contract: ethers.Contract,
  receipt: ethers.TransactionReceipt
): ethers.Log[] => {
  return receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
      } catch {
        return null;
      }
    })
    .filter((log): log is ethers.Log => log !== null);
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        functions.logger.warn(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};
