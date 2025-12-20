import { expect } from "chai";
import { ethers } from "hardhat";
import { Game2048 } from "../typechain-types";

describe("Game2048", function () {
  let game2048: Game2048;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const Game2048Factory = await ethers.getContractFactory("Game2048");
    game2048 = await Game2048Factory.deploy();
    await game2048.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await game2048.getAddress()).to.be.properAddress;
    });

    it("Should set the right owner", async function () {
      expect(await game2048.owner()).to.equal(owner.address);
    });
  });

  describe("Submit Score", function () {
    it("Should allow submitting a score", async function () {
      const tx = game2048.connect(player1).submitScore(100);
      await expect(tx).to.emit(game2048, "ScoreSubmitted");

      expect(await game2048.getUserBestScore(player1.address)).to.equal(100);
    });

    it("Should reject score of 0", async function () {
      await expect(
        game2048.connect(player1).submitScore(0)
      ).to.be.revertedWith("Score must be greater than 0");
    });

    it("Should reject score lower than current best", async function () {
      await game2048.connect(player1).submitScore(100);
      await expect(
        game2048.connect(player1).submitScore(50)
      ).to.be.revertedWith("Score must be higher than current best");
    });

    it("Should allow updating with higher score", async function () {
      await game2048.connect(player1).submitScore(100);
      await game2048.connect(player1).submitScore(200);

      expect(await game2048.getUserBestScore(player1.address)).to.equal(200);
    });

    it("Should increment total players for new players", async function () {
      expect(await game2048.getTotalPlayers()).to.equal(0);
      await game2048.connect(player1).submitScore(100);
      expect(await game2048.getTotalPlayers()).to.equal(1);
    });

    it("Should not increment total players for existing players", async function () {
      await game2048.connect(player1).submitScore(100);
      expect(await game2048.getTotalPlayers()).to.equal(1);
      await game2048.connect(player1).submitScore(200);
      expect(await game2048.getTotalPlayers()).to.equal(1);
    });
  });

  describe("Get User Rank", function () {
    it("Should return 0 for player with no score", async function () {
      expect(await game2048.getUserRank(player1.address)).to.equal(0);
    });

    it("Should return rank 1 for first player", async function () {
      await game2048.connect(player1).submitScore(100);
      expect(await game2048.getUserRank(player1.address)).to.equal(1);
    });

    it("Should return correct rank for multiple players", async function () {
      await game2048.connect(player1).submitScore(300);
      await game2048.connect(player2).submitScore(200);

      expect(await game2048.getUserRank(player1.address)).to.equal(1);
      expect(await game2048.getUserRank(player2.address)).to.equal(2);
    });
  });

  describe("Get Top Scores", function () {
    it("Should return empty array when no scores", async function () {
      const topScores = await game2048.getTopScores(10);
      expect(topScores.length).to.equal(0);
    });

    it("Should return top scores in descending order", async function () {
      await game2048.connect(player1).submitScore(100);
      await game2048.connect(player2).submitScore(200);

      const topScores = await game2048.getTopScores(10);
      expect(topScores.length).to.equal(2);
      expect(topScores[0].score).to.equal(200);
      expect(topScores[1].score).to.equal(100);
    });

    it("Should limit results to requested limit", async function () {
      // Submit scores with different players
      const signers = await ethers.getSigners();
      for (let i = 0; i < 3; i++) {
        await game2048.connect(signers[i]).submitScore((i + 1) * 100);
      }

      const topScores = await game2048.getTopScores(2);
      expect(topScores.length).to.equal(2);
    });
  });

  describe("Get User Stats", function () {
    it("Should return correct stats for player with score", async function () {
      await game2048.connect(player1).submitScore(100);
      const stats = await game2048.getUserStats(player1.address);

      expect(stats.score).to.equal(100);
      expect(stats.rank).to.equal(1);
      expect(stats.totalPlayersCount).to.equal(1);
    });

    it("Should return 0 for player with no score", async function () {
      const stats = await game2048.getUserStats(player1.address);
      expect(stats.score).to.equal(0);
      expect(stats.rank).to.equal(0);
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause", async function () {
      await game2048.pause();
      expect(await game2048.paused()).to.be.true;
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        game2048.connect(player1).pause()
      ).to.be.revertedWithCustomError(game2048, "OwnableUnauthorizedAccount");
    });

    it("Should prevent score submission when paused", async function () {
      await game2048.pause();
      await expect(
        game2048.connect(player1).submitScore(100)
      ).to.be.revertedWithCustomError(game2048, "EnforcedPause");
    });

    it("Should allow score submission after unpause", async function () {
      await game2048.pause();
      await game2048.unpause();
      await expect(game2048.connect(player1).submitScore(100))
        .to.emit(game2048, "ScoreSubmitted");
    });
  });
});

