// Include Bootstrap via CDN in your HTML file:
// <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

let playersData = {
  cricket: [],
  football: [],
  basketball: []
};

let currentPlayers = [];
let currentSport = "";
let currentIndex = 0;
let currentCategory = "";

let teams = [];
let players = {};
let unsoldPlayers = [];
let currentBids = {}; // store current bids per player

function initializeTeams() {
  const teamCount = parseInt(document.getElementById("teamCount").value);
  const budget = parseInt(document.getElementById("teamBudget").value);
  teams = [];
  players = {};
  unsoldPlayers = [];
  currentBids = {};

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
  currentPlayers.sort((a, b) => a.category.localeCompare(b.category)); // sort by category
  currentIndex = 0;
  currentCategory = "";
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
  const categoryHeading = document.getElementById("categoryHeading");
  if (currentIndex < currentPlayers.length) {
    const player = currentPlayers[currentIndex];
    document.getElementById("playerCategory").innerHTML = `<span class='badge bg-secondary'>Category: ${player.category}</span>`;
    document.getElementById("playerName").innerHTML = `<h4 class='text-primary'>Player: ${player.name}</h4>`;

    if (player.category !== currentCategory) {
      currentCategory = player.category;
      categoryHeading.innerHTML = `<h5 class='text-warning'>--- ${currentCategory} ---</h5>`;
    } else {
      categoryHeading.innerHTML = "";
    }

    currentBids = {};
    document.getElementById("lastBid").innerHTML = "";
  } else {
    document.getElementById("playerCategory").textContent = "No more players";
    document.getElementById("playerName").textContent = "";
    document.getElementById("lastBid").textContent = "";
    categoryHeading.textContent = "";
  }
}

function placeBid() {
  const name = document.getElementById("bidderName").value.trim();
  const amount = parseFloat(document.getElementById("bidAmount").value.trim());
  if (!name || isNaN(amount)) {
    alert("Enter both bidder name and valid amount");
    return;
  }

  if (currentIndex >= currentPlayers.length) return;

  const teamIndex = teams.findIndex(t => t.name.toLowerCase() === name.toLowerCase());
  if (teamIndex === -1) {
    alert("Team not found. Check team name.");
    return;
  }

  const team = teams[teamIndex];
  const player = currentPlayers[currentIndex];

  if (team.budget < amount) {
    alert("Insufficient budget.");
    return;
  }

  if (team.players.length >= 25) {
    alert("Maximum player limit reached.");
    return;
  }

  if (players[player.name]) {
    alert("Player already sold.");
    return;
  }

  currentBids[name] = amount;
  updateBidDisplay();
}

function finalizeBid() {
  const player = currentPlayers[currentIndex];
  if (!player) return;

  let highestBid = 0;
  let winningTeam = null;

  for (let teamName in currentBids) {
    if (currentBids[teamName] > highestBid) {
      highestBid = currentBids[teamName];
      winningTeam = teamName;
    }
  }

  if (winningTeam) {
    const team = teams.find(t => t.name === winningTeam);
    team.players.push(`🟢 ${player.name}`);
    team.budget -= highestBid;
    players[player.name] = team.name;
    document.getElementById("lastBid").innerHTML = `<div class='alert alert-success'>🎉 Sold to <strong>${winningTeam}</strong> for ₹${highestBid}</div>`;
  } else {
    if (!unsoldPlayers.includes(`🔴 ${player.name}`)) {
      unsoldPlayers.push(`🔴 ${player.name}`);
    }
    document.getElementById("lastBid").innerHTML = `<div class='alert alert-danger'>❌ Unsold</div>`;
  }

  nextPlayer();
  renderTeams();
  renderUnsoldPlayers();
}

function updateBidDisplay() {
  const bidEntries = Object.entries(currentBids).sort((a, b) => b[1] - a[1]);
  const display = bidEntries.map(([team, amount], index) => {
    const badgeClass = index === 0 ? "bg-success text-light" : "bg-secondary text-white";
    return `<span class='badge ${badgeClass} m-1 p-2'>${team}: ₹${amount}</span>`;
  }).join(" ");
  document.getElementById("lastBid").innerHTML = display;
}

function nextPlayer() {
  currentIndex++;
  showPlayer();
}

function startUnsoldRound() {
  if (unsoldPlayers.length === 0) {
    alert("No unsold players to re-auction.");
    return;
  }
  alert("Unsold players are now back in the auction.");
  currentPlayers = shuffle([...unsoldPlayers.map(name => {
    const cleanName = name.replace("🔴", "").trim();
    return { name: cleanName, category: "Unknown" };
  })]);
  currentPlayers.sort((a, b) => a.category.localeCompare(b.category));
  currentIndex = 0;
  currentCategory = "";
  unsoldPlayers = [];
  showPlayer();
}

function renderTeams() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "card m-2 shadow-sm";
    card.innerHTML = `
      <div class='card-body'>
        <h5 class='card-title'>${team.name}</h5>
        <p class='card-text'><strong>Budget Left:</strong> ₹${team.budget}</p>
        <p class='card-text'><strong>Players (${team.players.length}/25):</strong></p>
        <ul class='list-group list-group-flush'>
          ${team.players.map(p => `<li class='list-group-item'>${p}</li>`).join("")}
        </ul>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderUnsoldPlayers() {
  const list = document.getElementById("unsoldPlayers");
  list.innerHTML = unsoldPlayers.map(p => `<li class='list-group-item text-danger'>${p}</li>`).join("");
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
  alert("✅ Player added successfully!");

  document.getElementById("newPlayerName").value = "";
  document.getElementById("newCategory").value = "";
}
