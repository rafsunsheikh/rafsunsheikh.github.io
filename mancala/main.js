(() => {
  const pitButtons = Array.from(document.querySelectorAll("[data-pit]"));
  const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));
  const newGameBtn = document.getElementById("new-game");
  const turnEl = document.getElementById("turn");
  const messageEl = document.getElementById("message");
  const modeEl = document.getElementById("mode");
  const storeP1El = document.getElementById("store-p1");
  const storeP2El = document.getElementById("store-p2");
  const store6El = document.getElementById("pit-6");
  const store13El = document.getElementById("pit-13");
  const bannerEl = document.getElementById("game-over");
  const audioToggle = document.getElementById("audio-toggle");
  const audioVolume = document.getElementById("audio-volume");

  const audio = new Audio("assets/lofi.mp3");
  audio.loop = true;
  audio.preload = "none";

  let audioOn = false;

  let selectedMode = "PVP"; // "PVP" or "SOLO"

  const initialState = (mode = selectedMode) => ({
    pits: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0],
    currentPlayer: "P1",
    message: "Choose a pit to sow from.",
    gameOver: false,
    winner: null,
    mode,
    aiThinking: false
  });

  let state = initialState();

  const cloneState = (s) => ({
    pits: [...s.pits],
    currentPlayer: s.currentPlayer,
    message: s.message,
    gameOver: s.gameOver,
    winner: s.winner,
    mode: s.mode,
    aiThinking: s.aiThinking
  });

  const isStore = (index) => index === 6 || index === 13;
  const isOwnStore = (index, player) =>
    (player === "P1" && index === 6) || (player === "P2" && index === 13);

  const isPlayersPit = (index, player) => {
    if (player === "P1") return index >= 0 && index <= 5;
    return index >= 7 && index <= 12;
  };

  const oppositePit = (index) => 12 - index;

  const sumRange = (arr, start, end) =>
    arr.slice(start, end + 1).reduce((acc, val) => acc + val, 0);

  const finishIfEnded = (nextState) => {
    const playerOneSide = sumRange(nextState.pits, 0, 5);
    const playerTwoSide = sumRange(nextState.pits, 7, 12);

    if (playerOneSide === 0 || playerTwoSide === 0) {
      nextState.pits[6] += playerOneSide;
      nextState.pits[13] += playerTwoSide;
      for (let i = 0; i < 6; i += 1) {
        nextState.pits[i] = 0;
        nextState.pits[i + 7] = 0;
      }

      nextState.gameOver = true;
      nextState.currentPlayer = null;
      nextState.winner =
        nextState.pits[6] > nextState.pits[13]
          ? "Player 1"
          : nextState.pits[6] < nextState.pits[13]
          ? "Player 2"
          : "Tie";

      nextState.message =
        nextState.winner === "Tie"
          ? "The game ends in a tie."
          : `${nextState.winner} wins!`;
      nextState.aiThinking = false;
    }

    return nextState;
  };

  const applyMove = (currentState, selectedPit) => {
    const nextState = {
      pits: [...currentState.pits],
      currentPlayer: currentState.currentPlayer,
      message: "",
      gameOver: currentState.gameOver,
      winner: null,
      mode: currentState.mode,
      aiThinking: false
    };

    if (currentState.gameOver) {
      nextState.message = "Game over. Start a new game to play again.";
      return nextState;
    }

    if (!isPlayersPit(selectedPit, currentState.currentPlayer)) {
      nextState.message = "Pick one of your own pits.";
      return nextState;
    }

    let stones = nextState.pits[selectedPit];
    if (stones === 0) {
      nextState.message = "That pit is empty.";
      return nextState;
    }

    nextState.pits[selectedPit] = 0;
    let index = selectedPit;

    while (stones > 0) {
      index = (index + 1) % 14;

      if (
        (currentState.currentPlayer === "P1" && index === 13) ||
        (currentState.currentPlayer === "P2" && index === 6)
      ) {
        continue;
      }

      nextState.pits[index] += 1;
      stones -= 1;
    }

    const lastIndex = index;
    const storeIndex = currentState.currentPlayer === "P1" ? 6 : 13;

    // Capture rule: last stone lands in own empty pit and opposite pit has stones.
    if (
      !isStore(lastIndex) &&
      isPlayersPit(lastIndex, currentState.currentPlayer) &&
      nextState.pits[lastIndex] === 1
    ) {
      const opposite = oppositePit(lastIndex);
      const captured = nextState.pits[opposite];
      if (captured > 0) {
        nextState.pits[storeIndex] += captured + 1;
        nextState.pits[lastIndex] = 0;
        nextState.pits[opposite] = 0;
      }
    }

    const earnedExtraTurn = isOwnStore(lastIndex, currentState.currentPlayer);
    nextState.currentPlayer = earnedExtraTurn
      ? currentState.currentPlayer
      : currentState.currentPlayer === "P1"
      ? "P2"
      : "P1";

    nextState.message = earnedExtraTurn
      ? "You earned an extra turn."
      : `Player ${nextState.currentPlayer === "P1" ? "1" : "2"} to move.`;

    return finishIfEnded(nextState);
  };

  const pickAiMove = (currentState) => {
    const legalPits = [7, 8, 9, 10, 11, 12].filter(
      (idx) => currentState.pits[idx] > 0
    );
    if (legalPits.length === 0) return null;

    let best = { pit: legalPits[0], score: -Infinity };
    for (const pit of legalPits) {
      const simState = applyMove(
        { ...cloneState(currentState), currentPlayer: "P2" },
        pit
      );
      let score = simState.pits[13] - simState.pits[6];
      if (!simState.gameOver && simState.currentPlayer === "P2") {
        score += 0.5; // small bonus for earning another turn
      }
      if (score > best.score) {
        best = { pit, score };
      }
    }
    return best.pit;
  };

  const scheduleAiMove = () => {
    state = { ...state, aiThinking: true, message: "AI is thinking..." };
    render();

    setTimeout(() => {
      const aiPit = pickAiMove(state);
      if (aiPit === null) {
        state = finishIfEnded(state);
        state.aiThinking = false;
        render();
        return;
      }

      state = applyMove(state, aiPit);
      state.aiThinking = false;
      render();

      if (
        !state.gameOver &&
        state.mode === "SOLO" &&
        state.currentPlayer === "P2"
      ) {
        scheduleAiMove();
      }
    }, 350);
  };

  const renderModeButtons = () => {
    modeButtons.forEach((btn) => {
      const mode = btn.dataset.mode;
      btn.classList.toggle("active", mode === selectedMode);
    });
  };

  const render = () => {
    pitButtons.forEach((btn) => {
      const idx = Number(btn.dataset.pit);
      btn.textContent = state.pits[idx];

      const clickable =
        !state.gameOver &&
        !state.aiThinking &&
        isPlayersPit(idx, state.currentPlayer) &&
        state.pits[idx] > 0;

      btn.classList.toggle("enabled", clickable);
      btn.classList.toggle("disabled", !clickable);
      btn.setAttribute("aria-disabled", clickable ? "false" : "true");
    });

    store6El.textContent = state.pits[6];
    store13El.textContent = state.pits[13];
    storeP1El.textContent = state.pits[6];
    storeP2El.textContent = state.pits[13];

    turnEl.textContent = state.gameOver
      ? "-"
      : state.currentPlayer === "P1"
      ? "Player 1"
      : "Player 2";
    messageEl.textContent = state.message;
    modeEl.textContent =
      state.mode === "SOLO" ? "Solo vs AI" : "Two players";

    if (state.gameOver) {
      bannerEl.textContent = state.message;
      bannerEl.classList.remove("hidden");
    } else {
      bannerEl.classList.add("hidden");
    }

    renderModeButtons();
  };

  const updateAudioUI = () => {
    if (audioToggle) {
      audioToggle.textContent = audioOn ? "Pause music" : "Play music";
    }
  };

  const attachAudioHandlers = () => {
    if (audioVolume) {
      audio.volume = Number(audioVolume.value);
      audioVolume.addEventListener("input", (event) => {
        const vol = Number(event.target.value);
        audio.volume = vol;
      });
    }

    if (audioToggle) {
      audioToggle.addEventListener("click", async () => {
        try {
          if (!audioOn) {
            await audio.play();
            audioOn = true;
          } else {
            audio.pause();
            audioOn = false;
          }
          updateAudioUI();
        } catch (error) {
          console.error("Audio playback failed:", error);
          state = { ...state, message: "Unable to play music in this browser." };
          render();
        }
      });
    }

    updateAudioUI();
  };

  const handlePitClick = (event) => {
    const target = event.target.closest("[data-pit]");
    if (!target || state.aiThinking) return;
    const pitIndex = Number(target.dataset.pit);
    state = applyMove(state, pitIndex);
    render();

    if (
      !state.gameOver &&
      state.mode === "SOLO" &&
      state.currentPlayer === "P2"
    ) {
      scheduleAiMove();
    }
  };

  pitButtons.forEach((btn) =>
    btn.addEventListener("click", handlePitClick)
  );

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      if (mode === selectedMode) return;
      selectedMode = mode;
      state = initialState(selectedMode);
      render();
    });
  });

  newGameBtn.addEventListener("click", () => {
    state = initialState(selectedMode);
    render();
  });

  attachAudioHandlers();
  render();
})();
