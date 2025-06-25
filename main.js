// Minesweeper game stub

const Minesweeper = {
    gridWidth: 10,
    gridHeight: 10,
    numMines: 15,
    grid: [],
    timerInterval: null,
    timerStart: null,
    timerRunning: false,
    flagMode: false,
    selectedRow: 0,
    selectedCol: 0,
    firstMove: true,
    firstMoveCell: null,

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            const rowArr = [];
            for (let col = 0; col < this.gridWidth; col++) {
                rowArr.push({
                    revealed: false,
                    flagged: false,
                    mine: false,
                    adjacent: 0
                });
            }
            this.grid.push(rowArr);
        }
        this.firstMove = true;
        this.firstMoveCell = null;
    },

    placeMinesAndNumbers(safeRow, safeCol) {
        const totalCells = this.gridWidth * this.gridHeight;
        const safeIdx = safeRow * this.gridWidth + safeCol;
        // Generate a list of all possible indices except the safe cell
        let indices = [];
        for (let i = 0; i < totalCells - 1; i++) {
            indices.push(i);
        }
        // Shuffle indices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        // Take numMines indices
        let mineIndices = indices.slice(0, this.numMines).map(idx => idx >= safeIdx ? idx + 1 : idx);
        // Place mines
        for (let idx of mineIndices) {
            const row = Math.floor(idx / this.gridWidth);
            const col = idx % this.gridWidth;
            this.grid[row][col].mine = true;
        }
        // Calculate adjacent numbers
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                if (this.grid[row][col].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < this.gridHeight && nc >= 0 && nc < this.gridWidth) {
                            if (this.grid[nr][nc].mine) count++;
                        }
                    }
                }
                this.grid[row][col].adjacent = count;
            }
        }
    },

    setTextContentById(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    resetTimer() {
        this.stopTimer();
        this.timerStart = null;
        this.setTextContentById('timer', 'Time: 0 s');
    },

    updateTimerDisplay() {
        if (!this.timerRunning || this.timerStart === null) return;
        const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
        this.setTextContentById('timer', `Time: ${elapsed} s`);
    },

    updateMinesCounter() {
        let found = 0;
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                if (this.grid[row][col].flagged && this.grid[row][col].mine) found++;
            }
        }
        this.setTextContentById('mines-counter', `Found: ${found}/${this.numMines}`);
    },

    renderGrid() {
        const gridContainer = document.getElementById('minesweeper-grid');
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${this.gridWidth}, 30px)`;
        gridContainer.style.gridTemplateRows = `repeat(${this.gridHeight}, 30px)`;
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const cellData = this.grid[row][col];
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                if (row === this.selectedRow && col === this.selectedCol) {
                    cell.classList.add('selected');
                }
                if (cellData.revealed) {
                    cell.classList.add('revealed');
                    if (cellData.mine) {
                        cell.textContent = '💣';
                    } else if (cellData.adjacent > 0) {
                        cell.textContent = cellData.adjacent;
                        cell.classList.add(`number${cellData.adjacent}`);
                    } else {
                        cell.textContent = '';
                    }
                } else if (cellData.flagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                } else {
                    cell.textContent = '';
                }
                // Always add both click and contextmenu listeners, and use current flagMode
                cell.addEventListener('click', (e) => {
                    if (this.flagMode) {
                        this.flagCell(row, col);
                    } else {
                        this.revealCell(row, col);
                    }
                });
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (this.flagMode) {
                        this.revealCell(row, col);
                    } else {
                        this.flagCell(row, col);
                    }
                });
                gridContainer.appendChild(cell);
            }
        }
        this.updateMinesCounter();
    },

    resetGame() {
        this.initializeGrid();
        // Don't place mines yet
        this.renderGrid();
        this.resetTimer();
        this.updateMinesCounter();
    },

    startTimer() {
        if (this.timerRunning) return;
        this.timerStart = Date.now();
        this.timerRunning = true;
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
    },

    stopTimer() {
        this.timerRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    checkWin() {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                const cell = this.grid[row][col];
                if (!cell.mine && !cell.revealed) {
                    return false;
                }
            }
        }
        return true;
    },

    showCustomPopup(html, onClose) {
        let popup = document.getElementById('custom-popup');
        if (popup) popup.remove();
        popup = document.createElement('div');
        popup.id = 'custom-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = '#f8fafc';
        popup.style.border = '2px solid #64748b';
        popup.style.borderRadius = '12px';
        popup.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        popup.style.padding = '32px 28px 20px 28px';
        popup.style.zIndex = '10001';
        popup.style.maxWidth = '90vw';
        popup.style.maxHeight = '80vh';
        popup.style.overflowY = 'auto';
        popup.innerHTML = html;
        document.body.appendChild(popup);
        const closeBtn = popup.querySelector('.close-custom-popup');
        if (closeBtn) {
            closeBtn.onclick = () => {
                popup.remove();
                if (onClose) onClose();
            };
        }
        return popup;
    },

    revealCell(row, col) {
        if (!this.timerRunning) this.startTimer();
        if (this.firstMove) {
            this.placeMinesAndNumbers(row, col);
            this.firstMove = false;
        }
        const cell = this.grid[row][col];
        if (cell.revealed || cell.flagged) return;
        cell.revealed = true;
        if (cell.mine) {
            this.renderGrid();
            this.stopTimer();
            setTimeout(() => {
                this.showCustomPopup(
                    `<h2 style='color:#dc2626;margin-top:0'>Boom!</h2><p>You hit a bomb.</p><button class='close-custom-popup' style='background:#64748b;color:#fff;border:none;border-radius:6px;padding:8px 22px;font-size:1em;cursor:pointer;margin-top:12px;'>Reset</button>`,
                    () => this.resetGame()
                );
            }, 50);
            return;
        }
        if (cell.adjacent === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.gridHeight && nc >= 0 && nc < this.gridWidth) {
                        if (!this.grid[nr][nc].revealed && !this.grid[nr][nc].mine) {
                            this.revealCell(nr, nc);
                        }
                    }
                }
            }
        }
        this.renderGrid();
        if (this.checkWin()) {
            this.stopTimer();
            setTimeout(() => {
                const elapsed = this.timerStart ? ((Date.now() - this.timerStart) / 1000) : 0;
                this.showCustomPopup(
                    `<h2 style='color:#22c55e;margin-top:0'>Congratulations!</h2><p>You won in ${elapsed} seconds.</p><button class='close-custom-popup' style='background:#64748b;color:#fff;border:none;border-radius:6px;padding:8px 22px;font-size:1em;cursor:pointer;margin-top:12px;'>Reset</button>`,
                    () => this.resetGame()
                );
            }, 50);
        }
    },

    flagCell(row, col) {
        if (this.firstMove) {
            this.placeMinesAndNumbers(row, col);
            this.firstMove = false;
        }
        const cell = this.grid[row][col];
        if (cell.revealed) {
            let flaggedCount = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < this.gridHeight && nc >= 0 && nc < this.gridWidth) {
                        if (this.grid[nr][nc].flagged) flaggedCount++;
                    }
                }
            }
            if (flaggedCount === cell.adjacent && cell.adjacent > 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = row + dr;
                        const nc = col + dc;
                        if (nr >= 0 && nr < this.gridHeight && nc >= 0 && nc < this.gridWidth) {
                            if (!this.grid[nr][nc].flagged && !this.grid[nr][nc].revealed) {
                                this.revealCell(nr, nc);
                            }
                        }
                    }
                }
                this.renderGrid();
                return;
            }
        }
        if (!cell.revealed) {
            cell.flagged = !cell.flagged;
            this.renderGrid();
            this.updateMinesCounter();
        }
    },

    // Add selected cell highlight CSS if not already present
    addSelectedCellStyle() {
        if (!document.getElementById('cell-selected-style')) {
            const style = document.createElement('style');
            style.id = 'cell-selected-style';
            style.textContent = `.cell.selected { outline: 2px solid #475569; z-index: 2; }`;
            document.head.appendChild(style);
        }
    },

    // Instructions and event handling
    setupInstructionsAndEvents() {
        // Form and reset button event listeners
        const form = document.getElementById('settings-form');
        const widthInput = document.getElementById('width-input');
        const heightInput = document.getElementById('height-input');
        const minesInput = document.getElementById('mines-input');
        const resetBtn = document.getElementById('reset-btn');
        const easyBtn = document.getElementById('easy-btn');
        const mediumBtn = document.getElementById('medium-btn');
        const hardBtn = document.getElementById('hard-btn');
        const flagModeBtn = document.getElementById('flag-mode-btn');

        function setEasyDefaults() {
            widthInput.value = 8;
            heightInput.value = 8;
            minesInput.value = 10;
            Minesweeper.gridWidth = 8;
            Minesweeper.gridHeight = 8;
            Minesweeper.numMines = 10;
        }

        function updateFlagModeButton() {
            if (typeof flagModeBtn === 'undefined' || !flagModeBtn) {
                console.warn('updateFlagModeButton: flagModeBtn is not defined or null');
                return;
            }
            if (Minesweeper.flagMode) {
                flagModeBtn.classList.add('active');
            } else {
                flagModeBtn.classList.remove('active');
            }
        }

        easyBtn.addEventListener('click', () => {
            setEasyDefaults();
            Minesweeper.resetGame();
        });
        mediumBtn.addEventListener('click', () => {
            widthInput.value = 16;
            heightInput.value = 16;
            minesInput.value = 40;
            Minesweeper.gridWidth = 16;
            Minesweeper.gridHeight = 16;
            Minesweeper.numMines = 40;
            Minesweeper.resetGame();
        });
        hardBtn.addEventListener('click', () => {
            widthInput.value = 30;
            heightInput.value = 16;
            minesInput.value = 99;
            Minesweeper.gridWidth = 30;
            Minesweeper.gridHeight = 16;
            Minesweeper.numMines = 99;
            Minesweeper.resetGame();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Minesweeper.gridWidth = parseInt(widthInput.value, 10);
            Minesweeper.gridHeight = parseInt(heightInput.value, 10);
            Minesweeper.numMines = parseInt(minesInput.value, 10);
            Minesweeper.resetGame();
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                Minesweeper.resetGame();
            });
        } else {
            console.warn('Reset button with id "reset-btn" not found in the DOM.');
        }

        if (!flagModeBtn) {
            console.warn('Flag mode button with id "flag-mode-btn" not found in the DOM.');
        } else {
            flagModeBtn.addEventListener('click', () => {
                console.log('Flag mode button clicked');
                Minesweeper.flagMode = !Minesweeper.flagMode;
                updateFlagModeButton();
                Minesweeper.renderGrid();
            });
        }

        // Remove any old instructions div
        const oldInstructionsDiv = document.getElementById('instructions-bottom');
        if (oldInstructionsDiv) oldInstructionsDiv.remove();
        // Remove any old popup
        const oldPopup = document.getElementById('instructions-popup');
        if (oldPopup) oldPopup.remove();

        // Add instructions button at the bottom of the page
        let instrBtn = document.getElementById('instructions-btn');
        if (!instrBtn) {
            instrBtn = document.createElement('button');
            instrBtn.id = 'instructions-btn';
            instrBtn.textContent = 'Instructions';
            instrBtn.style.background = '#f1f5f9';
            instrBtn.style.border = '1.5px solid #cbd5e1';
            instrBtn.style.borderRadius = '6px';
            instrBtn.style.padding = '6px 18px';
            instrBtn.style.fontSize = '1em';
            instrBtn.style.cursor = 'pointer';
            instrBtn.style.margin = '32px auto 16px auto';
            instrBtn.style.display = 'block';
            instrBtn.style.color = '#334155';
            instrBtn.style.fontWeight = 'bold';
            instrBtn.onclick = showInstructionsPopup;
            document.body.appendChild(instrBtn);
        }

        function showInstructionsPopup() {
            let popup = document.getElementById('instructions-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'instructions-popup';
                popup.style.position = 'fixed';
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                popup.style.background = '#f8fafc';
                popup.style.border = '2px solid #64748b';
                popup.style.borderRadius = '12px';
                popup.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
                popup.style.padding = '32px 28px 20px 28px';
                popup.style.zIndex = '10001';
                popup.style.maxWidth = '90vw';
                popup.style.maxHeight = '80vh';
                popup.style.overflowY = 'auto';
                popup.innerHTML = `
                    <h2 style=\"margin-top:0; color:#334155;\">How to Play Minesweeper</h2>
                    <ul style=\"margin-bottom:18px; color:#334155; font-size:1.08em;\">
                      <li><b>Arrow keys</b>: Move the selection around the grid</li>
                      <li><b>Space</b>: Reveal (or flag, if flag mode is on) the selected cell</li>
                      <li><b>Shift</b>: Toggle flag mode</li>
                      <li><b>Cmd/Ctrl</b>: Right-click equivalent (flag or reveal, depending on flag mode)</li>
                      <li><b>r</b>: Reset the game</li>
                      <li><b>Mouse</b>: Left click to reveal, right click to flag (or vice versa in flag mode)</li>
                      <li><b>Win</b>: Reveal all non-mine cells</li>
                      <li><b>Chording</b>: Click a revealed number with the correct number of flags around it to reveal its neighbors</li>
                    </ul>
                    <button id=\"close-instructions-btn\" style=\"background:#64748b;color:#fff;border:none;border-radius:6px;padding:8px 22px;font-size:1em;cursor:pointer;\">Close</button>
                `;
                document.body.appendChild(popup);
                document.getElementById('close-instructions-btn').onclick = () => {
                    popup.remove();
                };
            }
        }

        function highlightSelectedCell() {
            const gridContainer = document.getElementById('minesweeper-grid');
            Array.from(gridContainer.children).forEach(cell => cell.classList.remove('selected'));
            const idx = Minesweeper.selectedRow * Minesweeper.gridWidth + Minesweeper.selectedCol;
            const cell = gridContainer.children[idx];
            if (cell) {
                cell.classList.add('selected');
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                switch (e.key) {
                    case 'ArrowUp':
                        if (Minesweeper.selectedRow > 0) Minesweeper.selectedRow--;
                        break;
                    case 'ArrowDown':
                        if (Minesweeper.selectedRow < Minesweeper.gridHeight - 1) Minesweeper.selectedRow++;
                        break;
                    case 'ArrowLeft':
                        if (Minesweeper.selectedCol > 0) Minesweeper.selectedCol--;
                        break;
                    case 'ArrowRight':
                        if (Minesweeper.selectedCol < Minesweeper.gridWidth - 1) Minesweeper.selectedCol++;
                        break;
                }
                highlightSelectedCell();
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                const cell = Minesweeper.grid[Minesweeper.selectedRow][Minesweeper.selectedCol];
                if (Minesweeper.flagMode) {
                    Minesweeper.flagCell(Minesweeper.selectedRow, Minesweeper.selectedCol);
                } else {
                    Minesweeper.revealCell(Minesweeper.selectedRow, Minesweeper.selectedCol);
                }
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                Minesweeper.resetGame();
            } else if (e.key === 'Shift') {
                e.preventDefault();
                Minesweeper.flagMode = !Minesweeper.flagMode;
                updateFlagModeButton();
            }
        });
    },

    init() {
        this.addSelectedCellStyle();
        this.setupInstructionsAndEvents();
        this.resetGame();
        this.updateMinesCounter();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Minesweeper.init();
});
