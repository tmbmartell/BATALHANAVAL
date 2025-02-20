class BattleshipGame {
    constructor() {
        this.boardSize = 15;
        this.currentPlayer = 1;
        this.setupPhase = true;
        this.ships = {
            1: [], // Player 1 ships
            2: []  // Player 2 ships
        };
        this.currentShip = {
            size: 0,
            orientation: 'horizontal'
        };
        this.gameOver = false;
        this.initializeBoards();
        this.setupEventListeners();
        this.updateGameStatus();
    }

    initializeBoards() {
        const player1Board = document.querySelector('.player1-board');
        const player2Board = document.querySelector('.player2-board');
        
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const cell1 = document.createElement('div');
            const cell2 = document.createElement('div');
            
            cell1.classList.add('cell');
            cell2.classList.add('cell');
            
            cell1.dataset.index = i;
            cell2.dataset.index = i;
            
            player1Board.appendChild(cell1);
            player2Board.appendChild(cell2);
        }
    }

    setupEventListeners() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
            cell.addEventListener('mouseover', () => this.handleCellHover(cell));
            cell.addEventListener('mouseout', () => this.handleCellLeave(cell));
        });

        document.getElementById('random').addEventListener('click', () => this.randomPlacement());
        document.getElementById('rotate').addEventListener('click', () => this.rotateShip());

        const ships = document.querySelectorAll('.ship');
        ships.forEach(ship => {
            ship.addEventListener('click', () => {
                this.currentShip.size = parseInt(ship.dataset.size);
                // Remove previous selection
                ships.forEach(s => s.classList.remove('selected'));
                ship.classList.add('selected');
            });
        });
    }

    handleCellHover(cell) {
        if (!this.setupPhase || this.currentShip.size === 0) return;

        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;

        const shipCells = this.getShipCells(row, col);
        if (shipCells) {
            const isValidPlacement = this.canPlaceShip(row, col);
            shipCells.forEach(cellIndex => {
                const targetCell = document.querySelector(
                    `.player${this.currentPlayer}-board .cell[data-index="${cellIndex}"]`
                );
                if (!targetCell.classList.contains(`player${this.currentPlayer}-ship`)) {
                    targetCell.classList.add('ship-preview');
                    targetCell.classList.add(isValidPlacement ? 'valid-placement' : 'invalid-placement');
                }
            });
        }
    }

    handleCellLeave(cell) {
        if (!this.setupPhase || this.currentShip.size === 0) return;
        
        // Remove preview-related classes from all cells on the current player's board
        const board = document.querySelector(`.player${this.currentPlayer}-board`);
        if (board) {
            const cells = board.querySelectorAll('.cell');
            cells.forEach(cell => {
                // Remove all preview-related classes in a single operation
                cell.classList.remove('ship-preview', 'valid-placement', 'invalid-placement');
                // Add smooth transition for visual feedback
                cell.style.transition = 'all 0.3s ease';
                cell.style.backgroundColor = '';
                cell.style.borderColor = '';
                // Reset any inline styles after transition
                setTimeout(() => {
                    cell.style.transition = '';
                    cell.style.removeProperty('background-color');
                    cell.style.removeProperty('border-color');
                    cell.style.removeProperty('transition');
                }, 300);
            });
        }
    }

    handleCellClick(cell) {
        if (this.gameOver) return;
        
        if (this.setupPhase) {
            this.placeShip(cell);
        } else {
            // Check if it's the correct board
            const boardClass = cell.parentElement.classList[0];
            const targetBoard = this.currentPlayer === 1 ? 'player2-board' : 'player1-board';
            if (boardClass === targetBoard) {
                this.attack(cell);
            }
        }
    }

    placeShip(cell) {
        if (this.currentShip.size === 0) return;

        const index = parseInt(cell.dataset.index);
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;

        if (this.canPlaceShip(row, col)) {
            const shipCells = this.getShipCells(row, col);
            shipCells.forEach(cellIndex => {
                const targetCell = document.querySelector(
                    `.player${this.currentPlayer}-board .cell[data-index="${cellIndex}"]`
                );
                targetCell.classList.add(`player${this.currentPlayer}-ship`);
            });

            this.ships[this.currentPlayer].push(shipCells);
            this.currentShip.size = 0;
            
            // Remove selection from ship buttons
            document.querySelectorAll('.ship').forEach(ship => {
                ship.classList.remove('selected');
            });

            if (this.ships[this.currentPlayer].length === 5) {
                if (this.currentPlayer === 1) {
                    this.switchPlayer();
                } else {
                    this.setupPhase = false;
                    this.currentPlayer = 1;
                    document.getElementById('setup').style.display = 'none';
                    document.getElementById('game-status').textContent = "Vez do Jogador 1 atacar";
                }
            }
        }
    }

    canPlaceShip(row, col) {
        const shipCells = this.getShipCells(row, col);
        if (!shipCells) return false;

        // Check if any cell is already occupied or adjacent to another ship
        return !shipCells.some(cellIndex => {
            const currentRow = Math.floor(cellIndex / this.boardSize);
            const currentCol = cellIndex % this.boardSize;

            // Check the cell itself and adjacent cells
            for (let r = Math.max(0, currentRow - 1); r <= Math.min(this.boardSize - 1, currentRow + 1); r++) {
                for (let c = Math.max(0, currentCol - 1); c <= Math.min(this.boardSize - 1, currentCol + 1); c++) {
                    const adjacentIndex = r * this.boardSize + c;
                    const adjacentCell = document.querySelector(
                        `.player${this.currentPlayer}-board .cell[data-index="${adjacentIndex}"]`
                    );
                    if (adjacentCell && adjacentCell.classList.contains(`player${this.currentPlayer}-ship`)) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    attack(cell) {
        if (this.setupPhase || this.gameOver) return;
        
        const targetBoard = this.currentPlayer === 1 ? 2 : 1;
        const index = parseInt(cell.dataset.index);

        if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

        const isHit = this.ships[targetBoard].some(ship => ship.includes(index));

        if (isHit) {
            cell.classList.add('hit');
            // Check if ship is sunk
            this.ships[targetBoard].forEach(ship => {
                if (ship.includes(index)) {
                    const isSunk = ship.every(cellIndex => {
                        const targetCell = document.querySelector(
                            `.player${targetBoard}-board .cell[data-index="${cellIndex}"]`
                        );
                        return targetCell.classList.contains('hit');
                    });
                    if (isSunk) {
                        ship.forEach(cellIndex => {
                            const targetCell = document.querySelector(
                                `.player${targetBoard}-board .cell[data-index="${cellIndex}"]`
                            );
                            targetCell.classList.add('sunk');
                        });
                    }
                }
            });
        } else {
            cell.classList.add('miss');
        }

        if (this.checkWinCondition()) {
            this.gameOver = true;
            document.getElementById('game-status').textContent = `Player ${this.currentPlayer} wins!`;
            this.addRestartButton();
        } else {
            this.switchPlayer();
        }
    }

    addRestartButton() {
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Reiniciar Jogo';
        restartButton.style.marginTop = '20px';
        restartButton.classList.add('restart-button');
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '16px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '4px';
        restartButton.style.transition = 'background-color 0.3s ease';
        restartButton.addEventListener('mouseover', () => {
            restartButton.style.backgroundColor = '#45a049';
        });
        restartButton.addEventListener('mouseout', () => {
            restartButton.style.backgroundColor = '#4CAF50';
        });
        restartButton.addEventListener('click', () => this.restartGame());
        document.body.appendChild(restartButton);
    }

    restartGame() {
        // Reset game state
        this.currentPlayer = 1;
        this.setupPhase = true;
        this.ships = { 1: [], 2: [] };
        this.currentShip = { size: 0, orientation: 'horizontal' };
        this.gameOver = false;

        // Clear all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('player1-ship', 'player2-ship', 'hit', 'miss', 'sunk', 'ship-preview');
        });

        // Show setup UI
        document.getElementById('setup').style.display = 'flex';

        // Remove restart button
        const restartButton = document.querySelector('.restart-button');
        if (restartButton) {
            restartButton.remove();
        }

        // Reset ship selection
        document.querySelectorAll('.ship').forEach(ship => {
            ship.classList.remove('selected');
        });

        this.updateGameStatus();
    }

    getShipCells(row, col) {
        const cells = [];
        const size = this.currentShip.size;

        if (this.currentShip.orientation === 'horizontal') {
            if (col + size > this.boardSize) return null;
            for (let i = 0; i < size; i++) {
                cells.push(row * this.boardSize + (col + i));
            }
        } else {
            if (row + size > this.boardSize) return null;
            for (let i = 0; i < size; i++) {
                cells.push((row + i) * this.boardSize + col);
            }
        }

        return cells;
    }

    checkWinCondition() {
        const targetBoard = this.currentPlayer === 1 ? 2 : 1;
        return this.ships[targetBoard].every(ship =>
            ship.every(cellIndex => {
                const cell = document.querySelector(
                    `.player${targetBoard}-board .cell[data-index="${cellIndex}"]`
                );
                return cell.classList.contains('hit');
            })
        );
    }

    rotateShip() {
        if (this.currentShip.size === 0) return;
        this.currentShip.orientation = 
            this.currentShip.orientation === 'horizontal' ? 'vertical' : 'horizontal';
        // Clear preview
        document.querySelectorAll('.ship-preview').forEach(cell => {
            cell.classList.remove('ship-preview');
        });
    }

    randomPlacement() {
        // Clear current ships
        this.ships[this.currentPlayer] = [];
        const cells = document.querySelectorAll(`.player${this.currentPlayer}-board .cell`);
        cells.forEach(cell => {
            cell.classList.remove(`player${this.currentPlayer}-ship`);
        });

        const shipSizes = [5, 4, 3, 3, 2];
        
        shipSizes.forEach(size => {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite loop

            while (!placed && attempts < maxAttempts) {
                const row = Math.floor(Math.random() * this.boardSize);
                const col = Math.floor(Math.random() * this.boardSize);
                this.currentShip.size = size;
                this.currentShip.orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

                if (this.canPlaceShip(row, col)) {
                    const shipCells = this.getShipCells(row, col);
                    shipCells.forEach(cellIndex => {
                        const targetCell = document.querySelector(
                            `.player${this.currentPlayer}-board .cell[data-index="${cellIndex}"]`
                        );
                        targetCell.classList.add(`player${this.currentPlayer}-ship`);
                    });
                    this.ships[this.currentPlayer].push(shipCells);
                    placed = true;
                }
                attempts++;
            }
        });

        // Reset current ship selection
        this.currentShip.size = 0;
        document.querySelectorAll('.ship').forEach(ship => {
            ship.classList.remove('selected');
        });

        // Check if all ships are placed
        if (this.ships[this.currentPlayer].length === 5) {
            if (this.currentPlayer === 1) {
                this.switchPlayer();
            } else {
                this.setupPhase = false;
                this.currentPlayer = 1;
                document.getElementById('setup').style.display = 'none';
                document.getElementById('game-status').textContent = "Player 1's turn to attack";
            }
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateGameStatus();
    }

    updateGameStatus() {
        const statusElement = document.getElementById('game-status');
        if (this.gameOver) {
            statusElement.textContent = `Player ${this.currentPlayer} wins!`;
        } else if (this.setupPhase) {
            statusElement.textContent = `Player ${this.currentPlayer} - Place your ships`;
        } else {
            statusElement.textContent = `Player ${this.currentPlayer}'s turn to attack`;
        }
    }
}