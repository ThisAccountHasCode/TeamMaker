// ----------------------------
// Utility Functions
// ----------------------------

function randomPastelColor() {
  const r = Math.floor(Math.random() * 127 + 127);
  const g = Math.floor(Math.random() * 127 + 127);
  const b = Math.floor(Math.random() * 127 + 127);
  return `rgb(${r},${g},${b})`;
}

function getContrastColor(rgb) {
  const parts = rgb.match(/\d+/g);
  if (!parts || parts.length < 3) return "black";
  const r = parseInt(parts[0], 10);
  const g = parseInt(parts[1], 10);
  const b = parseInt(parts[2], 10);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function save() {
  localStorage.setItem("teamBuilderData", JSON.stringify(data));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ----------------------------
// Data Initialization
// ----------------------------

let data = JSON.parse(localStorage.getItem("teamBuilderData")) || {
  players: [],
  teams: [],
};

if (data.teams.length === 0) {
  data.teams.push({
    id: Date.now().toString() + "-A",
    name: "Team A",
    members: [],
    color: randomPastelColor(),
  });
  data.teams.push({
    id: Date.now().toString() + "-B",
    name: "Team B",
    members: [],
    color: randomPastelColor(),
  });
  save();
}

// ----------------------------
// Rendering Functions
// ----------------------------

function createPlayerDiv(player, inTeam = false, teamColor = "") {
  const div = document.createElement("div");
  div.className = "player";
  if (inTeam) div.classList.add("team-colored");
  div.draggable = true;
  div.dataset.id = player.id;
  div.innerHTML = `${player.name} ${
    player.leader ? "<span class='leader'>&#x1F451;</span>" : ""
  }`;

  if (inTeam && teamColor) {
    div.style.backgroundColor = teamColor;
    div.style.color = getContrastColor(teamColor);
  } else {
    div.style.backgroundColor = "#4dabf7";
    div.style.color = "white";
  }

  div.ondragstart = (e) => {
    e.dataTransfer.setData("type", "player");
    e.dataTransfer.setData("id", player.id);
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(div, 10, 10);
    }
  };

  // Toggle leader status on click
  div.onclick = () => {
    player.leader = !player.leader;
    save();
    render();
  };

  return div;
}

function handleDropOnAvailable(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData("type");
  const id = e.dataTransfer.getData("id");
  if (!id) return;

  if (type === "player") {
    let changed = false;
    data.teams.forEach((team) => {
      const idx = team.members.indexOf(id);
      if (idx !== -1) {
        team.members.splice(idx, 1);
        changed = true;
      }
    });
    if (changed) {
      save();
      render();
    }
  }
}

function render() {
  // Render Available Players List
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
  playerList.ondragover = (e) => e.preventDefault();
  playerList.ondrop = handleDropOnAvailable;

  // Collect player IDs currently assigned to teams
  const playersInTeams = new Set();
  data.teams.forEach((team) => {
    team.members.forEach((id) => playersInTeams.add(id));
  });

  // Render unassigned players
  data.players.forEach((player) => {
    if (!playersInTeams.has(player.id)) {
      const div = createPlayerDiv(player, false);
      playerList.appendChild(div);
    }
  });

  // Render Teams and their Players
  const teamsContainer = document.getElementById("teamsContainer");
  teamsContainer.innerHTML = "";

  data.teams.forEach((team) => {
    const card = document.createElement("div");
    card.className = "team";
    card.dataset.id = team.id;

    // Team header with name and drag handle
    const header = document.createElement("strong");
    header.textContent = team.name;
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    // Drag handle
    const dragHandle = document.createElement("span");
    dragHandle.textContent = "≡"; // triple bar as handle icon
    dragHandle.title = "Drag to move team";
    dragHandle.style.cursor = "grab";
    dragHandle.style.userSelect = "none";
    dragHandle.style.marginLeft = "8px";
    dragHandle.style.fontWeight = "bold";

    dragHandle.draggable = true;
    dragHandle.ondragstart = (e) => {
      e.dataTransfer.setData("type", "team");
      e.dataTransfer.setData("id", team.id);
      if (e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(card, 10, 10);
      }
      card.classList.add("dragging");
    };
    dragHandle.ondragend = () => {
      card.classList.remove("dragging");
    };

    header.appendChild(dragHandle);
    card.appendChild(header);

    // Players container within team
    const playersContainer = document.createElement("div");
    playersContainer.className = "team-players";

    playersContainer.ondragover = (e) => e.preventDefault();
    playersContainer.ondrop = (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("type");
      const id = e.dataTransfer.getData("id");
      if (type === "player" && id) {
        // Remove player from any team
        data.teams.forEach((t) => {
          const idx = t.members.indexOf(id);
          if (idx !== -1) t.members.splice(idx, 1);
        });
        // Add player to this team if not already present
        if (!team.members.includes(id)) {
          team.members.push(id);
          save();
          render();
        }
      }
    };

    // Render players inside team
    team.members.forEach((id) => {
      const player = data.players.find((p) => p.id === id);
      if (player) {
        const div = createPlayerDiv(player, true, team.color);
        playersContainer.appendChild(div);
      }
    });

    card.appendChild(playersContainer);
    teamsContainer.appendChild(card);
  });
}

// ----------------------------
// Event Handlers for Adding / Clearing
// ----------------------------

function addTeam() {
  const input = document.getElementById("teamName");
  const name = input.value.trim();
  if (name) {
    data.teams.push({
      id: Date.now().toString(),
      name,
      members: [],
      color: randomPastelColor(),
    });
    input.value = "";
    save();
    render();
  }
}

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;

  const normalizedNewName = name.toLowerCase();
  const duplicate = data.players.some(
    (p) => p.name.toLowerCase() === normalizedNewName
  );

  if (duplicate) {
    alert(`Player "${name}" already exists! Please enter a unique name.`);
    return;
  }

  data.players.push({ id: Date.now().toString(), name, leader: false });
  input.value = "";
  save();
  render();
}

function clearBoard() {
  if (confirm("Are you sure you want to clear all players and teams?")) {
    localStorage.removeItem("teamBuilderData");
    data = {
      players: [],
      teams: [
        {
          id: Date.now().toString() + "-A",
          name: "Team A",
          members: [],
          color: randomPastelColor(),
        },
        {
          id: Date.now().toString() + "-B",
          name: "Team B",
          members: [],
          color: randomPastelColor(),
        },
      ],
    };
    save();
    render();
  }
}

// ----------------------------
// Trash Can Drag & Drop Handlers
// ----------------------------

const trashCan = document.getElementById("trashCan");

trashCan.ondragover = (e) => {
  e.preventDefault();
  trashCan.classList.add("over");
};

trashCan.ondragleave = () => {
  trashCan.classList.remove("over");
};

trashCan.ondrop = (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData("type");
  const id = e.dataTransfer.getData("id");
  if (!id) return;

  if (type === "player") {
    // Remove player completely
    data.players = data.players.filter((p) => p.id !== id);
    data.teams.forEach((team) => {
      team.members = team.members.filter((mid) => mid !== id);
    });
  } else if (type === "team") {
    // Remove team completely
    data.teams = data.teams.filter((t) => t.id !== id);
  }
  save();
  render();
  trashCan.classList.remove("over");
};

// ----------------------------
// Team Randomization
// ----------------------------

function randomizeTeams(numTeams) {
  if (numTeams < 1) return;

  // Create new teams
  data.teams = [];
  for (let i = 1; i <= numTeams; i++) {
    data.teams.push({
      id: Date.now().toString() + "-" + i,
      name: `Team ${i}`,
      members: [],
      color: randomPastelColor(),
    });
  }

  // Shuffle players copy
  const playersCopy = [...data.players];
  shuffleArray(playersCopy);

  // Distribute players evenly
  playersCopy.forEach((player, index) => {
    const teamIndex = index % numTeams;
    data.teams[teamIndex].members.push(player.id);
  });

  save();
  render();
}

// ----------------------------
// Footer: Fetch Last Edited Commit Info from GitHub
// ----------------------------

function addLastEditedFooter() {
  const footer = document.querySelector(".footer");
  if (!footer) {
    console.error("Footer div not found!");
    return;
  }
  footer.textContent = "Fetching last edited info...";

  fetch(
    "https://api.github.com/repos/ThisAccountHasCode/TeamMaker/commits?per_page=1"
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data || !data[0]) {
        footer.textContent = "No commit data found";
        return;
      }
      const commit = data[0];
      const date = new Date(commit.commit.committer.date);
      const formattedDate = date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const message = commit.commit.message;
      footer.textContent = `Last edited: ${formattedDate} · ${message}`;
    })
    .catch((err) => {
      console.error("Failed to fetch last commit info", err);
      footer.textContent = "Last edited: unknown";
    });
}

// ----------------------------
// Info Box Toggle
// ----------------------------

const infoBox = document.querySelector(".info-box");
const infoIcon = infoBox?.querySelector(".info-icon");

if (infoIcon) {
  infoIcon.addEventListener("click", () => {
    infoBox.classList.toggle("sticky");
  });
}

// ----------------------------
// Event Listeners for Inputs & Buttons
// ----------------------------

document.getElementById("teamName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTeam();
});

document.getElementById("playerName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addPlayer();
});

document.getElementById("addTeamBtn").addEventListener("click", addTeam);
document.getElementById("addPlayerBtn").addEventListener("click", addPlayer);
document.getElementById("clearBtn").addEventListener("click", clearBoard);

document.getElementById("randomizeBtn").addEventListener("click", () => {
  const numTeamsInput = document.getElementById("numTeamsInput");
  let numTeams = parseInt(numTeamsInput.value, 10);

  if (isNaN(numTeams) || numTeams < 1) numTeams = 1;
  if (numTeams > 10) numTeams = 10;

  randomizeTeams(numTeams);
});

// ----------------------------
// Initial Setup
// ----------------------------

addLastEditedFooter();
render();
