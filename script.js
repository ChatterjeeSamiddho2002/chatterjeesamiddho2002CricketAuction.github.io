let playersData = {
  cricket: [],
  football: [],
  basketball: []
};

let currentPlayers = [];
let currentSport = "";
let currentIndex = 0;

let teams = [];
let players = {};
let unsoldPlayers = [];

function initializeTeams() {
  const teamCount = parseInt(document.getElementById("teamCount").value);
  const budget = parseInt(document.getElementById("teamBudget").value);
  teams = [];
  players = {};
  unsoldPlayers = [];

  for (let i = 1; i <= teamCount; i++) {
    teams.push({
      name: `Team ${i}`,
      budget: budget,
      players: [],
    });
  }

  renderTeams();
  renderUnsoldPlayers();
}

function loadSport() {
  currentSport = document.getElementById("sport").value;
  currentPlayers = shuffle([...playersData[currentSport]]);
  currentIndex = 0;
  document.getElementById("currentSportTitle").textContent = `Auction: ${currentSport.toUpperCase()}`;
  document.getElementById("auctionSection").style.display = "block";
  showPlayer();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showPlayer() {
  if (currentIndex < currentPlayers.length) {
    const player = currentPlayers[currentIndex];
    document.getElementById("playerCategory").textContent = `Category: ${player.category}`;
    document.getElementById("playerName").textContent = `Player: ${player.name}`;
  } else {
    document.getElementById("playerCategory").textContent = "No more players";
    document.getElementById("playerName").textContent = "";
  }
}

function nextPlayer() {
  currentIndex++;
  showPlayer();
  document.getElementById("lastBid").textContent = "";
}

function placeBid() {
  const name = document.getElementById("bidderName").value.trim();
  const amount = parseInt(document.getElementById("bidAmount").value.trim());
  if (!name || isNaN(amount)) {
    alert("Enter both bidder name and valid amount");
    return;
  }

  if (currentIndex < currentPlayers.length) {
    const player = currentPlayers[currentIndex];

    const teamIndex = teams.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
    if (teamIndex === -1) {
      alert("Team not found. Check team name.");
      return;
    }

    const team = teams[teamIndex];
    if (team.budget >= amount && team.players.length < 25 && !players[player.name]) {
      team.players.push(player.name);
      team.budget -= amount;
      players[player.name] = team.name;
      document.getElementById("lastBid").textContent = `Sold to ${name} for ₹${amount}`;
    } else {
      if (!players[player.name]) {
        if (!unsoldPlayers.includes(player.name)) {
          unsoldPlayers.push(player.name);
        }
      }
      alert("Bid failed. Check budget, player cap, or if player is already taken.");
    }

    nextPlayer();
    renderTeams();
    renderUnsoldPlayers();
  }
}

function startUnsoldRound() {
  if (unsoldPlayers.length === 0) {
    alert("No unsold players to re-auction.");
    return;
  }
  alert("Unsold players are now back in the auction.");
  currentPlayers = shuffle([...unsoldPlayers.map(name => ({ name, category: "Unknown" }))]);
  currentIndex = 0;
  unsoldPlayers = [];
  showPlayer();
}

function renderTeams() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";

    card.innerHTML = `
      <h2>${team.name}</h2>
      <p>Budget Left: ₹${team.budget}</p>
      <p>Players: ${team.players.length}/25</p>
      <ul>${team.players.map(p => `<li>${p}</li>`).join("")}</ul>
    `;

    container.appendChild(card);
  });
}

function renderUnsoldPlayers() {
  const list = document.getElementById("unsoldPlayers");
  list.innerHTML = unsoldPlayers.map(p => `<li>${p}</li>`).join("");
}

function addPlayer() {
  const name = document.getElementById("newPlayerName").value.trim();
  const category = document.getElementById("newCategory").value.trim();

  if (!name || !category) {
    alert("Please enter both name and category");
    return;
  }

  const newPlayer = { name, category };
  playersData[currentSport].push(newPlayer);
  currentPlayers.push(newPlayer);
  alert("Player added successfully!");

  document.getElementById("newPlayerName").value = "";
  document.getElementById("newCategory").value = "";
}
