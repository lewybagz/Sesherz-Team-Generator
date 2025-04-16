document.addEventListener("DOMContentLoaded", () => {
  // Check if authenticated before initializing
  const AUTH_SESSION_KEY = "sesherz_auth_verified";
  const isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === "true";

  // Only initialize the app if authenticated or auth is hidden (already verified)
  if (
    isAuthenticated ||
    document.getElementById("auth-screen").classList.contains("hidden")
  ) {
    initApp();
  }

  function initApp() {
    // DOM Elements
    const teamSizeButtons = document.querySelectorAll(".team-size-btn");
    const playerNameInput = document.getElementById("player-name");
    const addPlayerBtn = document.getElementById("add-player");
    const selectedPlayersContainer =
      document.getElementById("selected-players");
    const savedPlayersContainer = document.getElementById("saved-players");
    const playerCountElement = document.getElementById("player-count");
    const generateTeamsBtn = document.getElementById("generate-teams");
    const resetBtn = document.getElementById("reset");
    const teamsContainer = document.getElementById("teams-container");
    const exportDataBtn = document.getElementById("export-data");
    const importFileInput = document.getElementById("import-file");

    // References to Firestore collection
    const playersCollection = db.collection("players");

    // App State
    let selectedTeamSize = 2; // Default to 2v2
    let selectedPlayers = [];
    let savedPlayers = [];
    let isLoading = true;

    // Initialize app
    init();

    async function init() {
      // Set default team size button as active
      teamSizeButtons[0].classList.add("active");

      // Show loading state
      savedPlayersContainer.innerHTML =
        '<div class="loading-spinner">Loading players...</div>';

      try {
        // Load saved players from Firestore
        await loadSavedPlayers();
      } catch (error) {
        console.error("Error loading players:", error);
        savedPlayersContainer.innerHTML =
          '<div class="error-message">Failed to load players. Please refresh.</div>';
      } finally {
        isLoading = false;
      }

      // Update player count
      updatePlayerCount();

      // Add event listeners
      addEventListeners();
    }

    function addEventListeners() {
      // Team size selection
      teamSizeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          teamSizeButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          selectedTeamSize = parseInt(btn.dataset.size);
        });
      });

      // Add player
      addPlayerBtn.addEventListener("click", addPlayer);
      playerNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addPlayer();
      });

      // Generate teams
      generateTeamsBtn.addEventListener("click", generateTeams);

      // Reset
      resetBtn.addEventListener("click", resetApp);

      // Export data
      exportDataBtn.addEventListener("click", exportPlayerData);

      // Import data
      importFileInput.addEventListener("change", importPlayerData);
    }

    async function addPlayer() {
      const playerName = playerNameInput.value.trim();

      if (!playerName) return;

      // Check if player is already selected
      if (selectedPlayers.includes(playerName)) {
        alert("This player is already selected!");
        return;
      }

      // Add to selected players
      selectedPlayers.push(playerName);

      // Add to saved players if not already saved
      if (!savedPlayers.includes(playerName)) {
        try {
          // Add to Firestore
          await playersCollection.doc(playerName).set({
            name: playerName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

          // Add to local saved players array
          savedPlayers.push(playerName);

          // Add to saved players display
          addSavedPlayerToDisplay(playerName);
        } catch (error) {
          console.error("Error saving player:", error);
          alert("Failed to save player. Please try again.");
        }
      }

      // Add to selected players display
      addSelectedPlayerToDisplay(playerName);

      // Clear input
      playerNameInput.value = "";
      playerNameInput.focus();

      // Update player count
      updatePlayerCount();
    }

    function addSelectedPlayerToDisplay(playerName) {
      const playerCard = document.createElement("div");
      playerCard.className = "player-card";
      playerCard.dataset.name = playerName;

      playerCard.innerHTML = `
              <span class="player-name">${playerName}</span>
              <div class="player-actions">
                  <button class="remove-btn" title="Remove"><i class="fas fa-times"></i></button>
              </div>
          `;

      // Remove player
      playerCard.querySelector(".remove-btn").addEventListener("click", () => {
        selectedPlayers = selectedPlayers.filter((p) => p !== playerName);
        playerCard.remove();
        updatePlayerCount();
      });

      selectedPlayersContainer.appendChild(playerCard);
    }

    function addSavedPlayerToDisplay(playerName) {
      // Check if already exists
      if (savedPlayersContainer.querySelector(`[data-name="${playerName}"]`))
        return;

      const playerCard = document.createElement("div");
      playerCard.className = "player-card saved-player";
      playerCard.dataset.name = playerName;

      playerCard.innerHTML = `
              <span class="player-name">${playerName}</span>
              <div class="player-actions">
                  <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
          `;

      // Click to add to selected players
      playerCard.addEventListener("click", (e) => {
        // If the click was on the delete button, don't add to selected players
        if (e.target.closest(".delete-btn")) return;

        if (!selectedPlayers.includes(playerName)) {
          selectedPlayers.push(playerName);
          addSelectedPlayerToDisplay(playerName);
          updatePlayerCount();
        } else {
          alert("This player is already selected!");
        }
      });

      // Delete player
      playerCard
        .querySelector(".delete-btn")
        .addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevent click event from bubbling up to card

          try {
            // Delete from Firestore
            await playersCollection.doc(playerName).delete();

            // Remove from local arrays
            savedPlayers = savedPlayers.filter((p) => p !== playerName);
            selectedPlayers = selectedPlayers.filter((p) => p !== playerName);

            // Remove from displays
            playerCard.remove();
            const selectedPlayerCard = selectedPlayersContainer.querySelector(
              `[data-name="${playerName}"]`
            );
            if (selectedPlayerCard) {
              selectedPlayerCard.remove();
            }

            // Update player count
            updatePlayerCount();
          } catch (error) {
            console.error("Error deleting player:", error);
            alert("Failed to delete player. Please try again.");
          }
        });

      savedPlayersContainer.appendChild(playerCard);
    }

    async function loadSavedPlayers() {
      // Clear the container first
      savedPlayersContainer.innerHTML = "";

      // Get all players from Firestore
      const snapshot = await playersCollection.get();

      // Reset saved players array
      savedPlayers = [];

      // Add each player to the array and display
      snapshot.forEach((doc) => {
        const playerName = doc.id;
        savedPlayers.push(playerName);
        addSavedPlayerToDisplay(playerName);
      });
    }

    function updatePlayerCount() {
      playerCountElement.textContent = selectedPlayers.length;
    }

    function generateTeams() {
      // Check if we have enough players
      const totalPlayers = selectedTeamSize * 2;

      if (selectedPlayers.length < totalPlayers) {
        alert(
          `You need at least ${totalPlayers} players for ${selectedTeamSize}v${selectedTeamSize} teams!`
        );
        return;
      }

      // Shuffle players
      const shuffledPlayers = [...selectedPlayers].sort(
        () => Math.random() - 0.5
      );

      // Split into teams
      const team1 = shuffledPlayers.slice(0, selectedTeamSize);
      const team2 = shuffledPlayers.slice(
        selectedTeamSize,
        selectedTeamSize * 2
      );

      // Display teams
      displayTeams(team1, team2);
    }

    function displayTeams(team1, team2) {
      // Clear previous teams
      teamsContainer.innerHTML = "";

      // Create team 1
      const team1Element = createTeamElement("Team 1", team1, "team-1");

      // Create team 2
      const team2Element = createTeamElement("Team 2", team2, "team-2");

      // Add to container
      teamsContainer.appendChild(team1Element);
      teamsContainer.appendChild(team2Element);

      // Show teams container
      teamsContainer.classList.add("active");

      // Scroll to teams
      teamsContainer.scrollIntoView({ behavior: "smooth" });
    }

    function createTeamElement(teamName, members, className) {
      const teamElement = document.createElement("div");
      teamElement.className = `team ${className}`;

      const teamHeader = document.createElement("div");
      teamHeader.className = "team-header";

      teamHeader.innerHTML = `
              <h3 class="team-name">${teamName}</h3>
          `;

      const membersList = document.createElement("ul");
      membersList.className = "team-members";

      members.forEach((member) => {
        const memberItem = document.createElement("li");
        memberItem.textContent = member;
        membersList.appendChild(memberItem);
      });

      teamElement.appendChild(teamHeader);
      teamElement.appendChild(membersList);

      return teamElement;
    }

    function resetApp() {
      // Clear selected players
      selectedPlayers = [];
      selectedPlayersContainer.innerHTML = "";

      // Hide teams
      teamsContainer.classList.remove("active");
      teamsContainer.innerHTML = "";

      // Reset player count
      updatePlayerCount();
    }

    // Export player data to JSON file
    function exportPlayerData() {
      if (savedPlayers.length === 0) {
        alert("No players to export!");
        return;
      }

      // Create JSON data
      const exportData = {
        players: savedPlayers,
        exportDate: new Date().toISOString(),
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);

      // Create Blob with JSON data
      const blob = new Blob([jsonData], { type: "application/json" });

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const a = document.createElement("a");
      a.href = url;
      a.download = `sesherz-players-${formatDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Import player data from JSON file
    async function importPlayerData(event) {
      const file = event.target.files[0];

      if (!file) return;

      // Create a file reader
      const reader = new FileReader();

      reader.onload = async function (e) {
        try {
          // Parse the JSON data
          const importData = JSON.parse(e.target.result);

          // Validate the data structure
          if (!importData.players || !Array.isArray(importData.players)) {
            throw new Error("Invalid file format. Missing players data.");
          }

          // Merge with existing players (avoiding duplicates)
          const newPlayers = importData.players.filter(
            (player) => !savedPlayers.includes(player)
          );

          if (newPlayers.length === 0) {
            alert("No new players to import!");
            return;
          }

          // Start a batch operation for better performance
          const batch = db.batch();

          // Add each new player to the batch
          newPlayers.forEach((playerName) => {
            const playerRef = playersCollection.doc(playerName);
            batch.set(playerRef, {
              name: playerName,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              importedAt: new Date().toISOString(),
            });
          });

          // Commit the batch
          await batch.commit();

          // Add new players to saved players array and display
          newPlayers.forEach((playerName) => {
            if (!savedPlayers.includes(playerName)) {
              savedPlayers.push(playerName);
              addSavedPlayerToDisplay(playerName);
            }
          });

          alert(`Successfully imported ${newPlayers.length} new player(s)!`);
        } catch (error) {
          console.error("Error importing players:", error);
          alert(`Error importing players: ${error.message}`);
        }

        // Reset the file input
        event.target.value = "";
      };

      reader.onerror = function () {
        alert("Error reading the file!");
        event.target.value = "";
      };

      reader.readAsText(file);
    }

    // Helper function to format date for filename
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
});
