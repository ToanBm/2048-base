# 2048 Onchain - Smart Contracts

Smart contracts cho game 2048 trên Base blockchain.

## 📁 Cấu trúc thư mục

```
2048-base/
├── contracts/              # Smart contracts project
│   ├── contracts/         # .sol files
│   │   └── Game2048.sol
│   ├── scripts/           # Deploy scripts
│   │   └── deploy.ts
│   ├── test/             # Test cases
│   │   └── Game2048.test.ts
│   ├── hardhat.config.ts # Hardhat configuration
│   ├── package.json       # Dependencies
│   ├── tsconfig.json      # TypeScript config
│   └── README.md          # This file
└── frontend/              # Frontend project
```

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
cd contracts
npm install
```

### 2. Cấu hình environment

Tạo file `.env` trong thư mục `contracts/`:

```bash
# Private key cho deploy (KHÔNG commit file này!)
PRIVATE_KEY=your_private_key_here

# Base Mainnet RPC URL
BASE_RPC_URL=https://mainnet.base.org

# Base Sepolia Testnet RPC URL  
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API Key để verify contract
BASESCAN_API_KEY=your_basescan_api_key_here

# Contract Address (sau khi deploy)
GAME2048_CONTRACT_ADDRESS=
```

### 3. Compile contracts

```bash
npm run compile
```

### 4. Test contracts

```bash
npm test
```

### 5. Deploy contracts

**Deploy lên Base Mainnet (mặc định):**
```bash
npm run deploy
# hoặc
npm run deploy:mainnet
```

**Deploy lên Base Sepolia (testnet - để test trước):**
```bash
npm run deploy:sepolia
```

⚠️ **Lưu ý**: Deploy lên Base Mainnet sẽ tốn phí gas thật. Nên test trên Sepolia trước!

### 6. Verify contract (sau khi deploy)

**Base Mainnet:**
```bash
npm run verify <CONTRACT_ADDRESS>
# hoặc
npm run verify:mainnet <CONTRACT_ADDRESS>
```

**Base Sepolia:**
```bash
npm run verify:sepolia <CONTRACT_ADDRESS>
```

## 📋 Contract Functions

### Core Functions

- `submitScore(uint256 score)` - Submit điểm mới
- `getUserBestScore(address player)` - Lấy điểm cao nhất của user
- `getUserRank(address player)` - Lấy rank của user
- `getTopScores(uint256 limit)` - Lấy top N điểm

### Bonus Functions

- `getUserStats(address player)` - Lấy cả score + rank + total players
- `getTotalPlayers()` - Tổng số người chơi
- `getTotalSubmissions()` - Tổng số lần submit

### Admin Functions

- `pause()` - Tạm dừng contract (chỉ owner)
- `unpause()` - Kích hoạt lại contract (chỉ owner)

## 🔧 Scripts

- `npm run compile` - Compile contracts
- `npm test` - Chạy tests
- `npm run deploy` - Deploy lên Base Mainnet (mặc định)
- `npm run deploy:mainnet` - Deploy lên Base Mainnet
- `npm run deploy:sepolia` - Deploy lên Base Sepolia (testnet)
- `npm run deploy:local` - Deploy lên local Hardhat network
- `npm run verify` - Verify contract trên Base Mainnet
- `npm run verify:mainnet` - Verify contract trên Base Mainnet
- `npm run verify:sepolia` - Verify contract trên Base Sepolia

## 📝 Lưu ý

1. **Private Key**: KHÔNG bao giờ commit file `.env` chứa private key
2. **Base Mainnet**: Mặc định deploy lên Base Mainnet. Đảm bảo có đủ ETH cho gas fees
3. **Test trước**: Nên test trên Base Sepolia trước khi deploy lên Mainnet
4. **Gas Optimization**: Contract chỉ lưu top 100 scores để tiết kiệm gas
5. **Security**: Sử dụng OpenZeppelin's Ownable và Pausable
6. **View Functions**: Các function `get*` là view functions, không tốn gas khi gọi

## 🔗 Tích hợp với Frontend

Sau khi deploy, cập nhật contract address trong frontend:

```typescript
// frontend/lib/constants.ts hoặc env.ts
export const GAME2048_CONTRACT_ADDRESS = "0x..."; // Address từ deploy
```

## 📚 Chi tiết Contract

Xem `contracts/contracts/Game2048.sol` để xem source code đầy đủ.

### Events

```solidity
event ScoreSubmitted(
    address indexed player,
    uint256 score,
    uint256 timestamp,
    uint256 newRank
);

event LeaderboardUpdated(address indexed player, uint256 newRank);
```
