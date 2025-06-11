import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CricketAuction() {
  const [teams, setTeams] = useState([]);
  const [teamCount, setTeamCount] = useState(10);
  const [budget, setBudget] = useState(100);
  const [players, setPlayers] = useState({});
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);

  const initializeTeams = () => {
    const newTeams = [];
    for (let i = 1; i <= teamCount; i++) {
      newTeams.push({
        name: `Team ${i}`,
        budget,
        players: [],
      });
    }
    setTeams(newTeams);
    setPlayers({});
    setUnsoldPlayers([]);
  };

  const handleBid = (teamIndex, playerName, bidAmount) => {
    const trimmedName = playerName.trim();
    if (!trimmedName || isNaN(bidAmount) || bidAmount <= 0) {
      alert("Please enter a valid player name and bid amount.");
      return;
    }

    const newTeams = [...teams];
    const team = newTeams[teamIndex];
    const amount = parseInt(bidAmount);
    if (
      team.budget >= amount &&
      team.players.length < 25 &&
      !Object.values(players).includes(trimmedName)
    ) {
      team.players.push(trimmedName);
      team.budget -= amount;
      setPlayers({ ...players, [trimmedName]: team.name });
      setTeams(newTeams);
      setUnsoldPlayers(unsoldPlayers.filter((name) => name !== trimmedName));
    } else {
      if (!Object.values(players).includes(trimmedName)) {
        setUnsoldPlayers([...unsoldPlayers, trimmedName]);
      }
      alert("Invalid bid. Check budget, team size, or if player already taken. Player marked as unsold.");
    }
  };

  const startUnsoldRound = () => {
    const remainingPlayers = unsoldPlayers.filter(
      (name) => !Object.values(players).includes(name)
    );
    if (remainingPlayers.length === 0) {
      alert("No unsold players left to re-auction.");
      return;
    }
    setUnsoldPlayers(remainingPlayers);
    alert("Unsold players are back in the auction round.");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cricket Auction Manager</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label>Number of Teams</label>
          <Input
            type="number"
            value={teamCount}
            onChange={(e) => setTeamCount(parseInt(e.target.value))}
            min={2}
            max={20}
          />
        </div>
        <div>
          <label>Budget per Team</label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            min={1}
          />
        </div>
      </div>
      <Button onClick={initializeTeams}>Initialize Teams</Button>
      <Button onClick={startUnsoldRound} className="ml-4 bg-yellow-400">Start Unsold Round</Button>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team, idx) => (
          <Card key={idx} className="p-4">
            <CardContent>
              <h2 className="text-xl font-semibold">{team.name}</h2>
              <p>Budget Left: ₹{team.budget}</p>
              <p>Players: {team.players.length}/25</p>
              <ul className="mt-2 list-disc list-inside">
                {team.players.map((player, i) => (
                  <li key={i}>{player}</li>
                ))}
              </ul>
              <div className="mt-4">
                <Input placeholder="Player Name" id={`name-${idx}`} />
                <Input placeholder="Bid Amount" id={`bid-${idx}`} type="number" className="mt-1" />
                <Button
                  className="mt-2"
                  onClick={() =>
                    handleBid(
                      idx,
                      document.getElementById(`name-${idx}`).value,
                      document.getElementById(`bid-${idx}`).value
                    )
                  }
                >
                  Bid Player
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {unsoldPlayers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Unsold Players</h2>
          <ul className="list-disc list-inside">
            {unsoldPlayers.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
