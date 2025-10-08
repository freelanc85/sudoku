// Basic Backtracking Solver (Original Algorithm)
class BasicSudokuSolver {
    constructor(boardId) {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.boardId = boardId;
        this.solutionSteps = 0;
        this.animationSpeed = 50;
    }

    initializeBoard() {
        const boardContainer = document.getElementById(this.boardId);
        boardContainer.innerHTML = '';

        // Create 9 subgrids (3x3 each)
        for (let subgridIndex = 0; subgridIndex < 9; subgridIndex++) {
            const subgrid = document.createElement('div');
            subgrid.className = 'subgrid';
            
            const subgridRow = Math.floor(subgridIndex / 3);
            const subgridCol = subgridIndex % 3;
            
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cellRow = Math.floor(cellIndex / 3);
                const cellCol = cellIndex % 3;
                
                const row = subgridRow * 3 + cellRow;
                const col = subgridCol * 3 + cellCol;
                
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.board = this.boardId;
                
                subgrid.appendChild(cell);
            }
            
            boardContainer.appendChild(subgrid);
        }
    }

    copyGrid(sourceGrid) {
        this.grid = sourceGrid.map(row => [...row]);
        this.updateGridDisplay();
    }

    updateGridDisplay() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"][data-board="${this.boardId}"]`);
                const value = this.grid[row][col];
                cell.textContent = value === 0 ? '' : value.toString();
                
                cell.classList.remove('filled', 'solving', 'invalid', 'given');
                
                if (value !== 0) {
                    cell.classList.add('given');
                }
            }
        }
    }

    isValidPlacement(row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (this.grid[row][c] === num) {
                return false;
            }
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (this.grid[r][col] === num) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.grid[r][c] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    async solveWithBasicBacktracking() {
        // Simple left-to-right, top-to-bottom approach
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    // Try numbers 1-9 in order
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidPlacement(row, col, num)) {
                            this.grid[row][col] = num;
                            this.solutionSteps++;
                            
                            // Animate the step
                            if (this.animationSpeed > 0) {
                                await this.animateStep(row, col, num, 'trying');
                            }
                            
                            if (await this.solveWithBasicBacktracking()) {
                                return true;
                            }
                            
                            // Backtrack
                            this.grid[row][col] = 0;
                            this.solutionSteps++;
                            
                            if (this.animationSpeed > 0) {
                                await this.animateStep(row, col, 0, 'backtrack');
                            }
                        }
                    }
                    return false;
                }
            }
        }
        return true; // Puzzle solved
    }

    async animateStep(row, col, value, type) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"][data-board="${this.boardId}"]`);
        
        if (type === 'trying') {
            cell.classList.add('solving');
            cell.textContent = value.toString();
            cell.classList.add('filled');
        } else if (type === 'backtrack') {
            cell.classList.add('invalid');
            await this.delay(this.animationSpeed);
            cell.textContent = '';
            cell.classList.remove('filled', 'invalid', 'solving');
        }
        
        await this.delay(this.animationSpeed);
        cell.classList.remove('solving', 'invalid');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Enhanced Sudoku Solver (Optimized Algorithm)
class SudokuSolver {
    constructor() {
        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.originalGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.possibilities = Array(9).fill().map(() => Array(9).fill().map(() => new Set([1,2,3,4,5,6,7,8,9])));
        this.isAnimating = false;
        this.solutionSteps = 0;
        this.animationSpeed = 50; // milliseconds
        this.speedSettings = [0, 25, 50, 200]; // Instant, Fast, Normal, Slow
        
        // Initialize basic solver for comparison
        this.basicSolver = new BasicSudokuSolver('basicBoard');
        
        this.initializeBoard();
        this.basicSolver.initializeBoard();
        this.attachEventListeners();
    }

    initializeBoard() {
        const boardContainer = document.getElementById('sudokuBoard');
        boardContainer.innerHTML = '';

        // Create 9 subgrids (3x3 each)
        for (let subgridIndex = 0; subgridIndex < 9; subgridIndex++) {
            const subgrid = document.createElement('div');
            subgrid.className = 'subgrid';
            
            // Calculate subgrid position
            const subgridRow = Math.floor(subgridIndex / 3);
            const subgridCol = subgridIndex % 3;
            
            // Create 9 cells for each subgrid
            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cellRow = Math.floor(cellIndex / 3);
                const cellCol = cellIndex % 3;
                
                // Calculate actual grid position
                const row = subgridRow * 3 + cellRow;
                const col = subgridCol * 3 + cellCol;
                
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.contentEditable = true;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add input validation
                cell.addEventListener('input', (e) => this.handleCellInput(e));
                cell.addEventListener('keydown', (e) => this.handleKeydown(e));
                cell.addEventListener('focus', (e) => {
                    e.target.select();
                    this.highlightRelated(row, col);
                });
                cell.addEventListener('blur', () => this.clearHighlights());
                
                subgrid.appendChild(cell);
            }
            
            boardContainer.appendChild(subgrid);
        }
    }

    // Initialize possibilities for constraint propagation
    initializePossibilities() {
        // Reset all possibilities
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    this.possibilities[row][col] = new Set([1,2,3,4,5,6,7,8,9]);
                } else {
                    this.possibilities[row][col] = new Set();
                }
            }
        }
        
        // Remove impossibilities based on current grid state
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] !== 0) {
                    this.eliminateFromPeers(row, col, this.grid[row][col]);
                }
            }
        }
    }

    // Eliminate a value from all peer cells (same row, column, box)
    eliminateFromPeers(row, col, value) {
        // Eliminate from row
        for (let c = 0; c < 9; c++) {
            if (c !== col) {
                this.possibilities[row][c].delete(value);
            }
        }
        
        // Eliminate from column
        for (let r = 0; r < 9; r++) {
            if (r !== row) {
                this.possibilities[r][col].delete(value);
            }
        }
        
        // Eliminate from 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (r !== row || c !== col) {
                    this.possibilities[r][c].delete(value);
                }
            }
        }
    }

    // Find the empty cell with the minimum remaining values (MCV heuristic)
    findMostConstrainedCell() {
        let minPossibilities = 10;
        let bestCell = null;
        
        try {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.grid[row][col] === 0) {
                        const possCount = this.possibilities[row][col].size;
                        
                        // Validate that possibilities make sense
                        if (possCount < 0 || possCount > 9) {
                            console.warn(`Invalid possibility count ${possCount} at (${row},${col})`);
                            continue;
                        }
                        
                        if (possCount < minPossibilities) {
                            minPossibilities = possCount;
                            bestCell = { row, col };
                            
                            // If only one possibility, this is the best we can do
                            if (possCount === 1) {
                                console.log(`Found cell with 1 possibility: (${row},${col})`);
                                return bestCell;
                            }
                        }
                    }
                }
            }
            
            if (bestCell) {
                console.log(`Most constrained cell: (${bestCell.row},${bestCell.col}) with ${minPossibilities} possibilities`);
            } else {
                console.log('No empty cells found - puzzle should be complete');
            }
            
            return bestCell;
            
        } catch (error) {
            console.error('Error in findMostConstrainedCell:', error);
            return null;
        }
    }

    // Order values by least constraining value (LCV) heuristic
    orderValuesByLCV(row, col, possibilities) {
        const values = Array.from(possibilities);
        
        // Count how many possibilities each value would eliminate
        const eliminationCounts = values.map(value => {
            let eliminations = 0;
            
            // Count eliminations in row
            for (let c = 0; c < 9; c++) {
                if (c !== col && this.possibilities[row][c].has(value)) {
                    eliminations++;
                }
            }
            
            // Count eliminations in column
            for (let r = 0; r < 9; r++) {
                if (r !== row && this.possibilities[r][col].has(value)) {
                    eliminations++;
                }
            }
            
            // Count eliminations in box
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    if ((r !== row || c !== col) && this.possibilities[r][c].has(value)) {
                        eliminations++;
                    }
                }
            }
            
            return { value, eliminations };
        });
        
        // Sort by fewest eliminations (least constraining first)
        eliminationCounts.sort((a, b) => a.eliminations - b.eliminations);
        return eliminationCounts.map(item => item.value);
    }

    // Apply constraint propagation techniques
    constraintPropagation() {
        let changed = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops
        
        try {
            while (changed && iterations < maxIterations) {
                changed = false;
                iterations++;
                
                // Naked singles: cells with only one possibility
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (this.grid[row][col] === 0 && this.possibilities[row][col].size === 1) {
                            const value = Array.from(this.possibilities[row][col])[0];
                            
                            // Validate the move before making it
                            if (this.isValidPlacement(row, col, value)) {
                                this.grid[row][col] = value;
                                this.possibilities[row][col] = new Set();
                                this.eliminateFromPeers(row, col, value);
                                changed = true;
                                console.log(`Naked single: placed ${value} at (${row},${col})`);
                            } else {
                                console.warn(`Invalid naked single: ${value} at (${row},${col})`);
                                return false; // Invalid state
                            }
                        }
                    }
                }
                
                // Hidden singles: values that can only go in one place in a unit
                const hiddenSinglesResult = this.findHiddenSingles();
                if (hiddenSinglesResult === false) {
                    return false; // Invalid state found
                }
                changed = hiddenSinglesResult || changed;
                
                // Check for contradictions after each iteration
                for (let row = 0; row < 9; row++) {
                    for (let col = 0; col < 9; col++) {
                        if (this.grid[row][col] === 0 && this.possibilities[row][col].size === 0) {
                            console.warn(`Contradiction found at (${row},${col}) during constraint propagation`);
                            return false;
                        }
                    }
                }
            }
            
            if (iterations >= maxIterations) {
                console.warn('Constraint propagation hit max iterations');
            }
            
            return true;
            
        } catch (error) {
            console.error('Error in constraint propagation:', error);
            return false;
        }
    }

    // Find hidden singles in rows, columns, and boxes
    findHiddenSingles() {
        let found = false;
        
        try {
            // Check rows
            for (let row = 0; row < 9; row++) {
                for (let value = 1; value <= 9; value++) {
                    const possibleCols = [];
                    for (let col = 0; col < 9; col++) {
                        if (this.grid[row][col] === 0 && this.possibilities[row][col].has(value)) {
                            possibleCols.push(col);
                        }
                    }
                    if (possibleCols.length === 1) {
                        const col = possibleCols[0];
                        if (this.isValidPlacement(row, col, value)) {
                            this.grid[row][col] = value;
                            this.possibilities[row][col] = new Set();
                            this.eliminateFromPeers(row, col, value);
                            found = true;
                            console.log(`Hidden single (row): placed ${value} at (${row},${col})`);
                        } else {
                            console.warn(`Invalid hidden single (row): ${value} at (${row},${col})`);
                            return false;
                        }
                    } else if (possibleCols.length === 0) {
                        // Value cannot be placed anywhere in this row - contradiction
                        console.warn(`No place for value ${value} in row ${row}`);
                        return false;
                    }
                }
            }
            
            // Check columns
            for (let col = 0; col < 9; col++) {
                for (let value = 1; value <= 9; value++) {
                    const possibleRows = [];
                    for (let row = 0; row < 9; row++) {
                        if (this.grid[row][col] === 0 && this.possibilities[row][col].has(value)) {
                            possibleRows.push(row);
                        }
                    }
                    if (possibleRows.length === 1) {
                        const row = possibleRows[0];
                        if (this.isValidPlacement(row, col, value)) {
                            this.grid[row][col] = value;
                            this.possibilities[row][col] = new Set();
                            this.eliminateFromPeers(row, col, value);
                            found = true;
                            console.log(`Hidden single (col): placed ${value} at (${row},${col})`);
                        } else {
                            console.warn(`Invalid hidden single (col): ${value} at (${row},${col})`);
                            return false;
                        }
                    } else if (possibleRows.length === 0) {
                        // Value cannot be placed anywhere in this column - contradiction
                        console.warn(`No place for value ${value} in column ${col}`);
                        return false;
                    }
                }
            }
            
            // Check boxes
            for (let boxIndex = 0; boxIndex < 9; boxIndex++) {
                const boxRow = Math.floor(boxIndex / 3) * 3;
                const boxCol = (boxIndex % 3) * 3;
                
                for (let value = 1; value <= 9; value++) {
                    const possibleCells = [];
                    for (let r = boxRow; r < boxRow + 3; r++) {
                        for (let c = boxCol; c < boxCol + 3; c++) {
                            if (this.grid[r][c] === 0 && this.possibilities[r][c].has(value)) {
                                possibleCells.push({ row: r, col: c });
                            }
                        }
                    }
                    if (possibleCells.length === 1) {
                        const { row, col } = possibleCells[0];
                        if (this.isValidPlacement(row, col, value)) {
                            this.grid[row][col] = value;
                            this.possibilities[row][col] = new Set();
                            this.eliminateFromPeers(row, col, value);
                            found = true;
                            console.log(`Hidden single (box): placed ${value} at (${row},${col})`);
                        } else {
                            console.warn(`Invalid hidden single (box): ${value} at (${row},${col})`);
                            return false;
                        }
                    } else if (possibleCells.length === 0) {
                        // Value cannot be placed anywhere in this box - contradiction
                        console.warn(`No place for value ${value} in box ${boxIndex}`);
                        return false;
                    }
                }
            }
            
            return found;
            
        } catch (error) {
            console.error('Error in findHiddenSingles:', error);
            return false;
        }
    }

    handleCellInput(event) {
        const cell = event.target;
        const value = cell.textContent.trim();
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Don't allow editing given numbers
        if (this.originalGrid[row][col] !== 0) {
            cell.textContent = this.originalGrid[row][col].toString();
            return;
        }

        // Validate input (only numbers 1-9)
        if (value === '' || /^[1-9]$/.test(value)) {
            cell.textContent = value;
            this.grid[row][col] = value === '' ? 0 : parseInt(value);
            cell.classList.remove('invalid');
            
            // Update corresponding cell in basic solver grid
            const basicCell = document.querySelector(`[data-row="${row}"][data-col="${col}"][data-board="basicBoard"]`);
            if (basicCell) {
                basicCell.textContent = value;
                this.basicSolver.grid[row][col] = value === '' ? 0 : parseInt(value);
                basicCell.classList.remove('invalid', 'filled', 'given');
            }
            
            if (value !== '') {
                cell.classList.add('filled');
                if (basicCell) basicCell.classList.add('filled');
                
                // Check if the number is valid in this position
                if (!this.isValidMove(row, col, parseInt(value))) {
                    cell.classList.add('invalid');
                    if (basicCell) basicCell.classList.add('invalid');
                    this.showStatus('Invalid move! Number violates Sudoku rules.', 'error');
                } else {
                    // Update possibilities when user enters a valid number
                    this.initializePossibilities();
                }
            } else {
                cell.classList.remove('filled');
                if (basicCell) basicCell.classList.remove('filled');
                // Update possibilities when user clears a cell
                this.initializePossibilities();
            }
        } else {
            // Invalid input, revert
            cell.textContent = this.grid[row][col] === 0 ? '' : this.grid[row][col].toString();
            this.showStatus('Please enter numbers 1-9 only.', 'error');
        }
        
        this.clearStatus(2000);
    }

    handleKeydown(event) {
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Don't allow editing given numbers
        if (this.originalGrid[row][col] !== 0 && !['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            return;
        }

        // Allow navigation with arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            this.navigateGrid(cell, event.key);
        }
        // Allow backspace and delete
        else if (['Backspace', 'Delete'].includes(event.key)) {
            if (this.originalGrid[row][col] === 0) {
                event.target.textContent = '';
                this.grid[row][col] = 0;
                event.target.classList.remove('filled', 'invalid');
            }
        }
        // Prevent non-numeric input
        else if (!/[1-9]/.test(event.key) && !['Tab', 'Enter'].includes(event.key)) {
            event.preventDefault();
        }
    }

    navigateGrid(currentCell, direction) {
        const row = parseInt(currentCell.dataset.row);
        const col = parseInt(currentCell.dataset.col);
        let newRow = row;
        let newCol = col;

        switch (direction) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(8, col + 1);
                break;
        }

        const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell) {
            newCell.focus();
        }
    }

    highlightRelated(row, col) {
        // Clear previous highlights
        this.clearHighlights();
        
        // Highlight row, column, and 3x3 box
        for (let i = 0; i < 9; i++) {
            // Highlight row
            const rowCell = document.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            if (rowCell) rowCell.classList.add('highlighted');
            
            // Highlight column
            const colCell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
            if (colCell) colCell.classList.add('highlighted');
        }
        
        // Highlight 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                const boxCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (boxCell) boxCell.classList.add('highlighted');
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.cell.highlighted').forEach(cell => {
            cell.classList.remove('highlighted');
        });
    }

    attachEventListeners() {
        document.getElementById('solveBtn').addEventListener('click', () => this.solvePuzzle());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('generateBtn').addEventListener('click', () => this.generatePuzzle());
        
        // Speed control
        const speedRange = document.getElementById('speedRange');
        speedRange.addEventListener('input', (e) => {
            this.animationSpeed = this.speedSettings[parseInt(e.target.value)];
        });
    }

    isValidMove(row, col, num) {
        // Store original value
        const original = this.grid[row][col];
        this.grid[row][col] = 0; // Temporarily remove to check
        
        const isValid = this.isValidPlacement(row, col, num);
        
        // Restore original value
        this.grid[row][col] = original;
        
        return isValid;
    }

    isValidPlacement(row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (this.grid[row][c] === num) {
                return false;
            }
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (this.grid[r][col] === num) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (this.grid[r][c] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    async solvePuzzle() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.solutionSteps = 0;
        this.basicSolver.solutionSteps = 0;
        
        // Set animation speed for both solvers
        this.basicSolver.animationSpeed = this.animationSpeed;
        
        this.showStatus('Solving puzzles with both algorithms...', 'solving');
        this.updateSolutionSteps('Starting comparison solve...');

        // Reset performance displays
        document.getElementById('optimizedTime').textContent = '-';
        document.getElementById('optimizedSteps').textContent = '-';
        document.getElementById('basicTime').textContent = '-';
        document.getElementById('basicSteps').textContent = '-';
        document.getElementById('speedImprovement').textContent = '-';
        document.getElementById('stepReduction').textContent = '-';

        // Initialize optimized solver
        this.initializePossibilities();
        this.constraintPropagation();
        
        // Copy current puzzle to basic solver
        this.basicSolver.copyGrid(this.grid);
        
        // Copy grids for backtracking
        const currentGrid = this.grid.map(row => [...row]);
        const currentPossibilities = this.possibilities.map(row => row.map(cell => new Set(cell)));
        const basicGrid = this.basicSolver.grid.map(row => [...row]);
        
        // Solve with both algorithms
        const startTime = performance.now();
        
        try {
            // Start optimized solver
            console.log('Starting optimized solver...');
            const optimizedPromise = this.solveWithOptimizedBacktracking().then(success => {
                const optimizedTime = performance.now() - startTime;
                console.log('Optimized solver completed:', success, 'in', optimizedTime, 'ms');
                return { success, time: optimizedTime, steps: this.solutionSteps, type: 'optimized' };
            }).catch(error => {
                console.error('Optimized solver error:', error);
                const optimizedTime = performance.now() - startTime;
                return { success: false, time: optimizedTime, steps: this.solutionSteps, type: 'optimized', error };
            });
            
            // Start basic solver
            console.log('Starting basic solver...');
            const basicPromise = this.basicSolver.solveWithBasicBacktracking().then(success => {
                const basicTime = performance.now() - startTime;
                console.log('Basic solver completed:', success, 'in', basicTime, 'ms');
                return { success, time: basicTime, steps: this.basicSolver.solutionSteps, type: 'basic' };
            }).catch(error => {
                console.error('Basic solver error:', error);
                const basicTime = performance.now() - startTime;
                return { success: false, time: basicTime, steps: this.basicSolver.solutionSteps, type: 'basic', error };
            });
            
            // Wait for both to complete
            const results = await Promise.all([optimizedPromise, basicPromise]);
            this.displayComparisonResults(results);
            
        } catch (error) {
            console.error('Main solving error:', error);
            this.showStatus('Error occurred during solving.', 'error');
            
            // Restore grids
            this.grid = currentGrid;
            this.possibilities = currentPossibilities;
            this.basicSolver.grid = basicGrid;
            this.updateGridDisplay();
            this.basicSolver.updateGridDisplay();
        }

        this.isAnimating = false;
    }

    displayComparisonResults(results) {
        const optimizedResult = results.find(r => r.type === 'optimized');
        const basicResult = results.find(r => r.type === 'basic');
        
        // Update individual stats
        document.getElementById('optimizedTime').textContent = optimizedResult.error ? 
            'Error' : `${Math.round(optimizedResult.time)}ms`;
        document.getElementById('optimizedSteps').textContent = optimizedResult.error ? 
            'Error' : optimizedResult.steps.toLocaleString();
        document.getElementById('basicTime').textContent = basicResult.error ? 
            'Error' : `${Math.round(basicResult.time)}ms`;
        document.getElementById('basicSteps').textContent = basicResult.error ? 
            'Error' : basicResult.steps.toLocaleString();
        
        // Calculate improvements only if both succeeded
        if (optimizedResult.success && basicResult.success && !optimizedResult.error && !basicResult.error) {
            const speedImprovement = (basicResult.time / optimizedResult.time).toFixed(1);
            const stepReduction = (((basicResult.steps - optimizedResult.steps) / basicResult.steps) * 100).toFixed(1);
            
            document.getElementById('speedImprovement').textContent = `${speedImprovement}x faster`;
            document.getElementById('stepReduction').textContent = `${stepReduction}% fewer steps`;
            
            this.showStatus('Both puzzles solved successfully!', 'success');
            this.updateSolutionSteps(`Optimized: ${optimizedResult.steps} steps in ${Math.round(optimizedResult.time)}ms`);
            
        } else {
            // Handle error cases
            document.getElementById('speedImprovement').textContent = '-';
            document.getElementById('stepReduction').textContent = '-';
            
            if (optimizedResult.error) {
                this.showStatus('Optimized solver encountered an error.', 'error');
                console.error('Optimized solver error:', optimizedResult.error);
            } else if (basicResult.error) {
                this.showStatus('Basic solver encountered an error.', 'error');
                console.error('Basic solver error:', basicResult.error);
            } else if (!optimizedResult.success && !basicResult.success) {
                this.showStatus('Both solvers failed to find a solution.', 'error');
            } else if (!optimizedResult.success) {
                this.showStatus('Optimized solver failed, basic solver succeeded.', 'error');
            } else if (!basicResult.success) {
                this.showStatus('Basic solver failed, optimized solver succeeded.', 'success');
                document.getElementById('speedImprovement').textContent = 'Much faster';
                document.getElementById('stepReduction').textContent = 'Much fewer';
            }
        }
    }

    async solveWithOptimizedBacktracking(depth = 0) {
        try {
            // Safety check to prevent infinite recursion
            if (depth > 81) {
                console.warn('Maximum recursion depth reached');
                return false;
            }

            // Apply constraint propagation first
            const propagationResult = this.constraintPropagation();
            if (propagationResult === false) {
                console.log('Constraint propagation failed at depth', depth);
                return false;
            }
            
            // Check for contradictions
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.grid[row][col] === 0 && this.possibilities[row][col].size === 0) {
                        console.log('Contradiction found at', row, col, 'depth', depth);
                        return false; // Contradiction found
                    }
                }
            }
            
            // Find the most constrained variable
            const cell = this.findMostConstrainedCell();
            if (!cell) {
                console.log('Puzzle solved at depth', depth);
                return true; // Puzzle solved
            }
            
            const { row, col } = cell;
            const possibleValues = this.possibilities[row][col];
            
            // If no possibilities, backtrack
            if (possibleValues.size === 0) {
                console.log('No possibilities for cell', row, col, 'at depth', depth);
                return false;
            }
            
            console.log(`Trying cell (${row},${col}) with ${possibleValues.size} possibilities at depth ${depth}`);
            
            // Try values in LCV order (least constraining first)
            const orderedValues = this.orderValuesByLCV(row, col, possibleValues);
            
            for (let i = 0; i < orderedValues.length; i++) {
                const value = orderedValues[i];
                console.log(`Trying value ${value} at (${row},${col}) - ${i+1}/${orderedValues.length}`);
                
                // Save state for backtracking
                const savedGrid = this.grid.map(row => [...row]);
                const savedPossibilities = this.possibilities.map(row => row.map(cell => new Set(cell)));
                
                // Make the move
                this.grid[row][col] = value;
                this.possibilities[row][col] = new Set();
                this.eliminateFromPeers(row, col, value);
                this.solutionSteps++;
                
                // Animate the step (only if not instant)
                if (this.animationSpeed > 0) {
                    await this.animateStep(row, col, value, 'trying');
                    this.updateSolutionSteps(`Step ${this.solutionSteps}: Trying ${value} at (${row + 1}, ${col + 1})`);
                }
                
                // Recursively solve
                const result = await this.solveWithOptimizedBacktracking(depth + 1);
                if (result === true) {
                    console.log('Success found with value', value, 'at', row, col);
                    return true;
                }
                
                // Backtrack
                console.log('Backtracking from value', value, 'at', row, col);
                this.grid = savedGrid;
                this.possibilities = savedPossibilities;
                this.solutionSteps++;
                
                if (this.animationSpeed > 0) {
                    await this.animateStep(row, col, 0, 'backtrack');
                    this.updateSolutionSteps(`Step ${this.solutionSteps}: Backtracking from (${row + 1}, ${col + 1})`);
                }
            }
            
            console.log('All values failed at', row, col, 'depth', depth);
            return false;
            
        } catch (error) {
            console.error('Error in solveWithOptimizedBacktracking at depth', depth, ':', error);
            return false;
        }
    }

    async animateStep(row, col, value, type) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (type === 'trying') {
            cell.classList.add('solving');
            cell.textContent = value.toString();
            cell.classList.add('filled');
        } else if (type === 'backtrack') {
            cell.classList.add('invalid');
            await this.delay(this.animationSpeed);
            cell.textContent = '';
            cell.classList.remove('filled', 'invalid', 'solving');
        }
        
        await this.delay(this.animationSpeed);
        cell.classList.remove('solving', 'invalid');
    }

    updateGridDisplay() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const value = this.grid[row][col];
                cell.textContent = value === 0 ? '' : value.toString();
                
                // Reset classes
                cell.classList.remove('filled', 'solving', 'invalid', 'given');
                
                if (value !== 0) {
                    if (this.originalGrid[row][col] !== 0) {
                        cell.classList.add('given');
                    } else {
                        cell.classList.add('filled');
                    }
                }
            }
        }
    }

    clearGrid() {
        if (this.isAnimating) return;

        this.grid = Array(9).fill().map(() => Array(9).fill(0));
        this.originalGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.possibilities = Array(9).fill().map(() => Array(9).fill().map(() => new Set([1,2,3,4,5,6,7,8,9])));
        
        // Clear basic solver grid
        this.basicSolver.grid = Array(9).fill().map(() => Array(9).fill(0));
        
        this.updateGridDisplay();
        this.basicSolver.updateGridDisplay();
        
        // Clear performance stats
        document.getElementById('optimizedTime').textContent = '-';
        document.getElementById('optimizedSteps').textContent = '-';
        document.getElementById('basicTime').textContent = '-';
        document.getElementById('basicSteps').textContent = '-';
        document.getElementById('speedImprovement').textContent = '-';
        document.getElementById('stepReduction').textContent = '-';
        
        this.showStatus('Grids cleared.', 'success');
        this.clearSolutionSteps();
        this.clearStatus(2000);
    }

    generatePuzzle() {
        if (this.isAnimating) return;

        this.clearGrid();
        
        // Generate a valid Sudoku puzzle
        const puzzle = this.createValidPuzzle();
        this.grid = puzzle.map(row => [...row]);
        this.originalGrid = puzzle.map(row => [...row]);
        
        // Copy to basic solver
        this.basicSolver.copyGrid(this.grid);
        
        // Initialize possibilities based on the new puzzle
        this.initializePossibilities();
        
        this.updateGridDisplay();
        this.showStatus('New puzzle generated for both grids!', 'success');
        this.clearSolutionSteps();
        this.clearStatus(2000);
    }

    createValidPuzzle() {
        // Start with an empty grid and fill it completely
        const completeGrid = Array(9).fill().map(() => Array(9).fill(0));
        this.fillGridCompletely(completeGrid);
        
        // Remove numbers to create a puzzle
        const puzzle = completeGrid.map(row => [...row]);
        const cellsToRemove = 40; // Remove 40 numbers for medium difficulty
        
        for (let i = 0; i < cellsToRemove; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            } while (puzzle[row][col] === 0);
            
            puzzle[row][col] = 0;
        }
        
        return puzzle;
    }

    fillGridCompletely(grid) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) {
                    // Shuffle numbers for randomness
                    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
                    
                    for (let num of shuffledNumbers) {
                        if (this.isValidPlacementForGrid(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (this.fillGridCompletely(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValidPlacementForGrid(grid, row, col, num) {
        // Check row
        for (let c = 0; c < 9; c++) {
            if (grid[row][c] === num) return false;
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (grid[r][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (grid[r][c] === num) return false;
            }
        }

        return true;
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.classList.add('fade-in');
    }

    clearStatus(delay = 0) {
        if (delay > 0) {
            setTimeout(() => {
                document.getElementById('statusMessage').textContent = '';
                document.getElementById('statusMessage').className = 'status-message';
            }, delay);
        }
    }

    updateSolutionSteps(step) {
        const stepsElement = document.getElementById('solutionSteps');
        stepsElement.textContent = step;
        stepsElement.scrollTop = stepsElement.scrollHeight;
    }

    clearSolutionSteps() {
        document.getElementById('solutionSteps').textContent = '';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the Sudoku solver when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuSolver();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey) {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                document.getElementById('solveBtn').click();
                break;
            case 'Backspace':
                event.preventDefault();
                document.getElementById('clearBtn').click();
                break;
            case 'g':
                event.preventDefault();
                document.getElementById('generateBtn').click();
                break;
        }
    }
});