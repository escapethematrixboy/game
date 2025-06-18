import * as fs from 'fs';
import * as readline from 'readline';

// Define types for our game
interface Building {
  name: string;
  count: number;
  baseCost: number;
  baseProduction: number;
  upgrades: Upgrade[];
}

interface Upgrade {
  name: string;
  purchased: boolean;
  cost: number;
  productionMultiplier: number;
  description: string;
}

interface GameState {
  points: number;
  totalPointsEarned: number;
  clickPower: number;
  buildings: Building[];
  lastSaved: number;
}

// Initialize the game state
let gameState: GameState = {
  points: 0,
  totalPointsEarned: 0,
  clickPower: 1,
  buildings: [
    {
      name: "Cursor",
      count: 0,
      baseCost: 15,
      baseProduction: 0.1,
      upgrades: [
        {
          name: "Faster Clicking",
          purchased: false,
          cost: 100,
          productionMultiplier: 2,
          description: "Double the production of Cursors"
        },
        {
          name: "Auto Clicker",
          purchased: false,
          cost: 500,
          productionMultiplier: 3,
          description: "Triple the production of Cursors"
        }
      ]
    },
    {
      name: "Farm",
      count: 0,
      baseCost: 100,
      baseProduction: 1,
      upgrades: [
        {
          name: "Fertilizer",
          purchased: false,
          cost: 1000,
          productionMultiplier: 2,
          description: "Double the production of Farms"
        },
        {
          name: "Irrigation",
          purchased: false,
          cost: 5000,
          productionMultiplier: 3,
          description: "Triple the production of Farms"
        }
      ]
    },
    {
      name: "Factory",
      count: 0,
      baseCost: 1100,
      baseProduction: 8,
      upgrades: [
        {
          name: "Assembly Line",
          purchased: false,
          cost: 12000,
          productionMultiplier: 2,
          description: "Double the production of Factories"
        },
        {
          name: "Automation",
          purchased: false,
          cost: 60000,
          productionMultiplier: 3,
          description: "Triple the production of Factories"
        }
      ]
    }
  ],
  lastSaved: Date.now()
};

// Save filename
const SAVE_FILE = 'clicker-save.json';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to save game state
function saveGame(): void {
  gameState.lastSaved = Date.now();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(gameState, null, 2));
  console.log('Game saved!');
}

// Function to load game state
function loadGame(): boolean {
  try {
    if (fs.existsSync(SAVE_FILE)) {
      const data = fs.readFileSync(SAVE_FILE, 'utf8');
      gameState = JSON.parse(data);
      console.log('Game loaded!');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading save file:', error);
    return false;
  }
}

// Calculate building cost based on current count
function getBuildingCost(building: Building): number {
  return Math.floor(building.baseCost * Math.pow(1.15, building.count));
}

// Calculate building production per second
function getBuildingProduction(building: Building): number {
  let multiplier = 1;
  for (const upgrade of building.upgrades) {
    if (upgrade.purchased) {
      multiplier *= upgrade.productionMultiplier;
    }
  }
  return building.count * building.baseProduction * multiplier;
}

// Calculate total production per second
function getTotalProduction(): number {
  return gameState.buildings.reduce((total, building) => {
    return total + getBuildingProduction(building);
  }, 0);
}

// Manual click function
function click(): void {
  gameState.points += gameState.clickPower;
  gameState.totalPointsEarned += gameState.clickPower;
}

// Buy a building
function buyBuilding(index: number): boolean {
  const building = gameState.buildings[index];
  const cost = getBuildingCost(building);
  
  if (gameState.points >= cost) {
    gameState.points -= cost;
    building.count++;
    return true;
  }
  return false;
}

// Buy an upgrade
function buyUpgrade(buildingIndex: number, upgradeIndex: number): boolean {
  const building = gameState.buildings[buildingIndex];
  const upgrade = building.upgrades[upgradeIndex];
  
  if (!upgrade.purchased && gameState.points >= upgrade.cost) {
    gameState.points -= upgrade.cost;
    upgrade.purchased = true;
    return true;
  }
  return false;
}

// Format numbers for display
function formatNumber(num: number): string {
  if (num < 1000) return num.toFixed(1);
  if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
  return (num / 1000000000).toFixed(2) + 'B';
}

// Display game status
function displayStatus(): void {
  console.clear();
  console.log('=== TERMINAL CLICKER GAME ===');
  console.log(`Points: ${formatNumber(gameState.points)} (${formatNumber(getTotalProduction())} per second)`);
  console.log(`Total earned: ${formatNumber(gameState.totalPointsEarned)}`);
  console.log('\n=== BUILDINGS ===');
  
  gameState.buildings.forEach((building, i) => {
    console.log(`${i+1}. ${building.name}: ${building.count} | Cost: ${formatNumber(getBuildingCost(building))} points | Producing: ${formatNumber(getBuildingProduction(building))} per second`);
  });
  
  console.log('\n=== UPGRADES ===');
  gameState.buildings.forEach((building, i) => {
    building.upgrades.forEach((upgrade, j) => {
      if (!upgrade.purchased) {
        console.log(`${i+1}${String.fromCharCode(97 + j)}. ${building.name} - ${upgrade.name}: ${formatNumber(upgrade.cost)} points | ${upgrade.description}`);
      }
    });
  });
  
  console.log('\n=== COMMANDS ===');
  console.log('C - Click for points');
  console.log('1-3 - Buy building (number corresponds to the building)');
  console.log('1a, 1b, 2a, 2b, 3a, 3b - Buy upgrade');
  console.log('S - Save game');
  console.log('L - Load game');
  console.log('Q - Quit game');
}

// Game loop
let lastUpdate = Date.now();
function gameLoop(): void {
  const now = Date.now();
  const elapsed = (now - lastUpdate) / 1000; // seconds
  lastUpdate = now;
  
  // Add points from passive production
  const pointsGained = getTotalProduction() * elapsed;
  gameState.points += pointsGained;
  gameState.totalPointsEarned += pointsGained;
  
  // Update display
  displayStatus();
}

// Handle user input
function handleInput(input: string): void {
  input = input.trim().toLowerCase();
  
  switch(input) {
    case 'c':
      click();
      break;
    case '1':
    case '2':
    case '3':
      const buildingIndex = parseInt(input) - 1;
      if (buyBuilding(buildingIndex)) {
        console.log(`Purchased a ${gameState.buildings[buildingIndex].name}!`);
      } else {
        console.log('Not enough points!');
      }
      break;
    case '1a':
      buyUpgrade(0, 0) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case '1b':
      buyUpgrade(0, 1) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case '2a':
      buyUpgrade(1, 0) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case '2b':
      buyUpgrade(1, 1) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case '3a':
      buyUpgrade(2, 0) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case '3b':
      buyUpgrade(2, 1) ? console.log('Upgrade purchased!') : console.log('Not enough points or already purchased!');
      break;
    case 's':
      saveGame();
      break;
    case 'l':
      loadGame();
      break;
    case 'q':
      console.log('Thanks for playing!');
      clearInterval(gameInterval);
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('Unknown command. Try again.');
  }
}

// Check for save file on startup
loadGame();

// Game update interval (updates every 100ms)
const gameInterval = setInterval(gameLoop, 100);

// Listen for user input
rl.on('line', handleInput);

// Display initial status
displayStatus();

console.log('\nPress C to click for points!');