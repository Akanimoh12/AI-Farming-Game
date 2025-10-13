/**
 * Smart contract ABIs for Orange Farm
 * Import only necessary function signatures to reduce bundle size
 */

export const MockOrangeTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function canMintDaily(address player) view returns (bool)",
  "function dailyMint() returns (uint256)",
  "function decimals() view returns (uint8)",
] as const;

export const LandNFTABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getLandType(uint256 tokenId) view returns (uint8)",
  "function getLandCapacity(uint256 tokenId) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
] as const;

export const BotNFTABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getBotType(uint256 tokenId) view returns (uint8)",
  "function getBotStats(uint256 tokenId) view returns (uint256 harvestRate, uint256 waterConsumption)",
  "function getAssignment(uint256 tokenId) view returns (uint256 landTokenId, bool isActive)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event BotAssigned(uint256 indexed botTokenId, uint256 indexed landTokenId, address indexed owner)",
] as const;

export const WaterTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
] as const;

export const GameRegistryABI = [
  "function isPlayerRegistered(address player) view returns (bool)",
  "function getPlayerProfile(address player) view returns (string username, string referralCode, address referredBy, uint256 registeredAt)",
  "function register(string username, string referralCode) returns (bool)",
  "function getPlayerStats(address player) view returns (uint256 totalHarvests, uint256 totalOranges, uint256 lastHarvest)",
  "event PlayerRegistered(address indexed player, string username, string referralCode, address indexed referredBy)",
] as const;

export const MarketplaceABI = [
  "function buyLand(uint8 landType) returns (uint256 tokenId)",
  "function buyBot(uint8 botType) returns (uint256 tokenId)",
  "function buyWater(uint8 packageType) returns (uint256 amount)",
  "function batchPurchase(uint8[] landTypes, uint8[] botTypes, uint8[] waterPackages) returns (uint256[] landTokenIds, uint256[] botTokenIds, uint256 waterAmount)",
  "function getLandPrice(uint8 landType) view returns (uint256)",
  "function getBotPrice(uint8 botType) view returns (uint256)",
  "function getWaterPrice(uint8 packageType) view returns (uint256)",
  "event AssetPurchased(address indexed buyer, string assetType, uint256 indexed tokenId, uint256 price)",
  "event BatchPurchase(address indexed buyer, uint256 totalCost, uint256 itemCount)",
] as const;

export const HarvestSettlementABI = [
  "function getCurrentSeason() view returns (uint256 seasonId, uint256 startTime, uint256 endTime, bool finalized)",
  "function commitHarvest(uint256 seasonId, address player, uint256 oranges, bytes32[] proof) returns (bool)",
  "function batchCommitHarvests(uint256 seasonId, address[] players, uint256[] oranges, bytes32[][] proofs) returns (bool)",
  "function hasClaimedSeason(uint256 seasonId, address player) view returns (bool)",
  "event HarvestCommitted(uint256 indexed seasonId, address indexed player, uint256 oranges)",
  "event SeasonFinalized(uint256 indexed seasonId, bytes32 merkleRoot, uint256 totalOranges)",
] as const;

// Contract addresses interface
export interface ContractAddresses {
  mockOrangeToken: string;
  landNFT: string;
  botNFT: string;
  waterToken: string;
  gameRegistry: string;
  marketplace: string;
  harvestSettlement: string;
}

// Type-safe contract names
export type ContractName =
  | "mockOrangeToken"
  | "landNFT"
  | "botNFT"
  | "waterToken"
  | "gameRegistry"
  | "marketplace"
  | "harvestSettlement";

// ABI map
export const ContractABIs = {
  mockOrangeToken: MockOrangeTokenABI,
  landNFT: LandNFTABI,
  botNFT: BotNFTABI,
  waterToken: WaterTokenABI,
  gameRegistry: GameRegistryABI,
  marketplace: MarketplaceABI,
  harvestSettlement: HarvestSettlementABI,
} as const;
