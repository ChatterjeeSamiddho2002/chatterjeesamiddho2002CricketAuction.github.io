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

function handleBid(teamIndex, playerInputId, bidInputId) {
  const playerName = document.getElementById(playerInputId).value.trim();
  const bidAmount = parseInt(document.getElementById(bidInputId).value);

  if (!playerName || isNaN(bidAmount) || bidAmount <= 0) {
    alert("Enter a valid player name and bid amount.");
    return;
  }

  const team = teams[teamIndex];
  if (
    team.budget >= bidAmount &&
    team.players.length < 25 &&
    !players[playerName]
  ) {
    team.players.push(playerName);
    team.budget -= bidAmount;
    players[playerName] = team.name;
    unsoldPlayers = unsoldPlayers.filter(p => p !== playerName);
  } else {
    if (!players[playerName]) {
      if (!unsoldPlayers.includes(playerName)) {
        unsoldPlayers.push(playerName);
      }
    }
    alert("Bid failed. Check budget, player cap, or if player is already taken.");
  }

  renderTeams();
  renderUnsoldPlayers();
}

function startUnsoldRound() {
  if (unsoldPlayers.length === 0) {
    alert("No unsold players to re-auction.");
    return;
  }
  alert("Unsold players are now back in the auction.");
}

function renderTeams() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach((team, index) => {
    const card = document.createElement("div");
    card.className = "team-card";

    card.innerHTML = `
      <h2>${team.name}</h2>
      <p>Budget Left: ₹${team.budget}</p>
      <p>Players: ${team.players.length}/25</p>
      <ul>${team.players.map(p => `<li>${p}</li>`).join("")}</ul>
      <input type="text" placeholder="Player Name" id="player-${index}" />
      <input type="number" placeholder="Bid Amount" id="bid-${index}" />
      <button onclick="handleBid(${index}, 'player-${index}', 'bid-${index}')">Bid Player</button>
    `;

    container.appendChild(card);
  });
}

function renderUnsoldPlayers() {
  const list = document.getElementById("unsoldPlayers");
  list.innerHTML = unsoldPlayers.map(p => `<li>${p}</li>`).join("");
}
