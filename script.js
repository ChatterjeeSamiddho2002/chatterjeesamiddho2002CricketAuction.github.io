// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA-nfEWO7BNx-XW4kRI5jqcEt-kVfxQ7T4",
  authDomain: "auctionsite-backend.firebaseapp.com",
  databaseURL: "https://auctionsite-backend-default-rtdb.firebaseio.com",
  projectId: "auctionsite-backend",
  storageBucket: "auctionsite-backend.appspot.com",
  messagingSenderId: "232850109661",
  appId: "1:232850109661:web:c2b7509b526ac925249734",
  measurementId: "G-199LFVLV3S"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Variables for multiplayer state ---
let auctionRef = null;
let auctionState = null;
let auctionId = null;
let myTeamId = null;
let myTeamName = null;
let isPaused = false;
let pausedTimeLeft = 0;

// --- Sport configs (same as before, truncated for brevity) ---
const sportConfigs = {
  cricket: {
    positions: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
    teamNames: 'Mumbai Indians, Chennai Super Kings, Royal Challengers Bangalore, Delhi Capitals, Kolkata Knight Riders, Punjab Kings, Rajasthan Royals, Sunrisers Hyderabad',
    samplePlayers: [
      {name: "Virat Kohli", position: "Batsman", basePrice: 2},
      {name: "MS Dhoni", position: "Wicket-keeper", basePrice: 2},
      {name: "Jasprit Bumrah", position: "Bowler", basePrice: 2}
    ]
  },
  // ... (other sports as in your original code)
};

function updateSportSettings() {
  const selectedSport = document.getElementById('sportSelect').value;
  const config = sportConfigs[selectedSport];
  document.getElementById('teamNames').value = config.teamNames;
}
document.getElementById('sportSelect').addEventListener('change', updateSportSettings);

// --- File upload handler (Excel import, as before) ---
let players = [];
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      players = jsonData.map(row => ({
        name: row.Name || row.name || 'Unknown',
        position: row.Position || row.position || 'Unknown',
        basePrice: parseFloat(row.BasePrice || row.basePrice || row['Base Price'] || 0.5)
      }));
      alert(`Successfully loaded ${players.length} players from Excel file!`);
    } catch (error) {
      alert('Error reading Excel file. Please check the format.');
      console.error(error);
    }
  };
  reader.readAsArrayBuffer(file);
});

// --- Start Auction (multiplayer aware) ---
function startAuction() {
  auctionId = document.getElementById('roomCode').value.trim();
  myTeamName = document.getElementById('yourTeamName').value.trim();
  if (!auctionId || !myTeamName) {
    alert("Enter both room code and your team name!");
    return;
  }
  auctionRef = db.ref('auctions/' + auctionId);

  auctionRef.once('value', snap => {
    let state = snap.val();
    if (!state) {
      // Create new auction room
      myTeamId = 0;
      const selectedSport = document.getElementById('sportSelect').value;
      const config = sportConfigs[selectedSport];
      const numTeams = parseInt(document.getElementById('numTeams').value);
      const budget = parseFloat(document.getElementById('teamBudget').value);
      const teamNamesText = document.getElementById('teamNames').value;
      let initPlayers = players.length ? players : config.samplePlayers;
      // Shuffle players
      initPlayers = initPlayers.sort(() => Math.random() - 0.5);
      // Setup teams
      const teamNames = teamNamesText.split(',').map(name => name.trim()).slice(0, numTeams);
      const teams = teamNames.map((name, index) => ({
        id: index,
        name: name,
        budget: budget,
        players: [],
        slots: {}
      }));
      // Ensure myTeamName is in teams
      if (!teamNames.includes(myTeamName)) {
        myTeamId = teams.length;
        teams.push({id: myTeamId, name: myTeamName, budget: budget, players: [], slots: {}});
      } else {
        myTeamId = teamNames.indexOf(myTeamName);
      }
      auctionRef.set({
        players: initPlayers,
        teams: teams,
        currentPlayerIndex: 0,
        currentBid: initPlayers[0].basePrice,
        currentBidder: null,
        status: "running",
        logs: []
      });
    } else {
      // Join existing team or add new one
      let found = false;
      if (state.teams) {
        state.teams.forEach((team, idx) => {
          if (team.name.toLowerCase() === myTeamName.toLowerCase()) {
            myTeamId = team.id;
            found = true;
          }
        });
      }
      if (!found) {
        myTeamId = (state.teams && state.teams.length) ? state.teams.length : 0;
        let newTeam = { id: myTeamId, name: myTeamName, budget: 100, players: [], slots: {} };
        auctionRef.child('teams').transaction(teams => {
          if (!teams) teams = [];
          teams.push(newTeam);
          return teams;
        });
      }
    }
  });

  // Listen for changes
  auctionRef.on('value', snap => {
    auctionState = snap.val();
    if (auctionState) updateAuctionUI();
  });

  document.getElementById('setupSection').classList.add('hidden');
  document.getElementById('auctionSection').classList.remove('hidden');
}

// --- UI Update Logic (all from auctionState) ---
function updateAuctionUI() {
  if (!auctionState || !auctionState.players || auctionState.currentPlayerIndex >= auctionState.players.length) {
    endAuction();
    return;
  }
  // Current Player
  const player = auctionState.players[auctionState.currentPlayerIndex];
  document.getElementById('playerInfo').innerHTML = `
    <div class="text-3xl font-bold">${player.name}</div>
    <div class="text-xl mt-2">${player.position}</div>
    <div class="text-lg mt-1">Base Price: ₹${player.basePrice} Cr</div>
  `;
  // Current Bid
  document.getElementById('currentBid').textContent =
    auctionState.currentBidder !== null && auctionState.teams[auctionState.currentBidder]
      ? `₹${auctionState.currentBid.toFixed(2)} Cr - ${auctionState.teams[auctionState.currentBidder].name}`
      : `₹${auctionState.currentBid.toFixed(2)} Cr - No bids yet`;
  // Timer (not implemented in this minimal version)
  document.getElementById('auctionTimer').textContent = auctionState.status === "paused" ? "Paused" : "";

  // Bidding Buttons
  const biddingContainer = document.getElementById('biddingButtons');
  biddingContainer.innerHTML = auctionState.teams.map(team => `
    <button onclick="placeBid(${team.id})" id="bidBtn${team.id}"
      class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
      ${auctionState.status !== "running" || team.budget < getNextBidAmount(auctionState.currentBid) ? "disabled" : ""}>
      ${team.name}
    </button>
  `).join('');

  // Teams Overview
  const container = document.getElementById('teamsGrid');
  container.innerHTML = auctionState.teams.map(team => {
    const slotsDisplay = Object.entries(team.slots || {})
      .map(([position, count]) => {
        const displayName = position.charAt(0).toUpperCase() + position.slice(1);
        return `<span class="mr-2">${displayName}: ${count}</span>`;
      }).join('');
    return `
      <div class="team-slot rounded-lg p-4 text-white">
        <h4 class="font-bold text-lg">${team.name}</h4>
        <p class="text-sm">Budget: ₹${team.budget.toFixed(2)} Cr</p>
        <p class="text-sm">Players: ${team.players.length}</p>
        <div class="text-xs mt-2">${slotsDisplay}</div>
        <div class="mt-2 text-xs">
          ${team.players.map(p => `${p.name} (₹${p.boughtPrice})`).join(', ')}
        </div>
      </div>
    `;
  }).join('');

  // Remaining Players
  const remaining = auctionState.players.slice(auctionState.currentPlayerIndex + 1);
  document.getElementById('remainingPlayers').innerHTML = remaining.map(player => `
    <div class="player-card rounded p-2 mb-2 text-white text-sm">
      <div class="font-semibold">${player.name}</div>
      <div class="text-xs">${player.position} - ₹${player.basePrice} Cr</div>
    </div>
  `).join('');
}

// --- Multiplayer Bidding ---
function placeBid(teamId) {
  if (!auctionState || auctionState.status !== "running") return;
  const nextBid = getNextBidAmount(auctionState.currentBid);
  auctionRef.transaction(state => {
    if (!state) return;
    if (state.status !== "running") return state;
    const team = state.teams[teamId];
    if (!team) return state;
    if (team.budget >= nextBid && nextBid > state.currentBid) {
      state.currentBid = nextBid;
      state.currentBidder = teamId;
      state.logs = state.logs || [];
      state.logs.push(`${team.name} bid ₹${nextBid}`);
    }
    return state;
  });
}

// --- Next Player ---
function nextPlayer() {
  if (!auctionState) return;
  auctionRef.transaction(state => {
    if (!state) return;
    if (state.currentBidder !== null) {
      // Sell player to team
      const player = state.players[state.currentPlayerIndex];
      const team = state.teams[state.currentBidder];
      if (team && team.budget >= state.currentBid) {
        team.players.push({...player, boughtPrice: state.currentBid});
        team.budget -= state.currentBid;
        // Update slots
        const position = player.position.toLowerCase();
        if (!team.slots) team.slots = {};
        team.slots[position] = (team.slots[position] || 0) + 1;
        state.logs = state.logs || [];
        state.logs.push(`${player.name} SOLD to ${team.name} for ₹${state.currentBid} Cr`);
      }
    }
    state.currentPlayerIndex++;
    if (state.currentPlayerIndex < state.players.length) {
      const nextPlayer = state.players[state.currentPlayerIndex];
      state.currentBid = nextPlayer.basePrice;
      state.currentBidder = null;
    }
    return state;
  });
}

// --- Skip Player ---
function skipPlayer() {
  if (!auctionState) return;
  auctionRef.transaction(state => {
    if (!state) return;
    state.logs = state.logs || [];
    const player = state.players[state.currentPlayerIndex];
    state.logs.push(`${player.name} was skipped`);
    state.currentPlayerIndex++;
    if (state.currentPlayerIndex < state.players.length) {
      const nextPlayer = state.players[state.currentPlayerIndex];
      state.currentBid = nextPlayer.basePrice;
      state.currentBidder = null;
    }
    return state;
  });
}

// --- Pause/Resume Auction ---
function togglePause() {
  if (!auctionState) return;
  if (auctionState.status === "paused") {
    auctionRef.update({ status: "running" });
    document.getElementById('pauseBtn').textContent = "Pause";
  } else {
    auctionRef.update({ status: "paused" });
    document.getElementById('pauseBtn').textContent = "Resume";
  }
}

// --- End Auction ---
function endAuction() {
  document.getElementById('currentPlayerCard').innerHTML = `
    <h2 class="text-3xl font-bold mb-4">🏆 Auction Completed!</h2>
    <div class="text-xl mb-4">All players have been auctioned.</div>
    <button onclick="location.reload()" 
      class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
      Start New Auction
    </button>
  `;
  document.getElementById('nextPlayerBtn').disabled = true;
  document.getElementById('biddingButtons').innerHTML = '<div class="col-span-full text-center text-gray-400">Auction Completed</div>';
}

// --- Bid increment logic ---
function getNextBidAmount(current) {
  if (current >= 8) {
    return Math.ceil(current) + 1;
  } else if (current >= 1) {
    return current + 0.5;
  } else {
    return current + 0.05;
  }
}
