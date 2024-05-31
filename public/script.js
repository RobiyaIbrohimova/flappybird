document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registration-form');
    const gameContainer = document.getElementById('game-container');
    const bird = document.querySelector('.bird');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardBody = document.getElementById('leaderboard-body');
    let birdY = window.innerHeight / 2;
    const blockWidth = 80;
    const blockSpacing = 200;
    let score = 0;
    let gameOver = false;
    let difficultyMultiplier = 1;
    let playerId = null;

    function updateScore() {
        score++;
        console.log("Score:", score);
    }

    function startGame(difficulty) {
        birdY = window.innerHeight / 2;
        bird.style.top = `${birdY}px`;
        score = 0;
        gameOver = false;
        switch (difficulty) {
            case 'easy':
                difficultyMultiplier = 1;
                break;
            case 'medium':
                difficultyMultiplier = 1.5;
                break;
            case 'hard':
                difficultyMultiplier = 2;
                break;
            default:
                difficultyMultiplier = 1;
        }
        createInitialBlocks();
        requestAnimationFrame(updateGame);
    }
    

    function flyUp() {
        if (!gameOver) {
            birdY -= 60;
            bird.style.top = `${birdY}px`;
        }
    }

    function updateGame() {
        if (!gameOver) {
            moveBlocks();
            birdY += 1.5 * difficultyMultiplier;
            bird.style.top = `${birdY}px`;
            checkCollisions();

            if (birdY < 0 || birdY > window.innerHeight) {
                gameOver = true;
                alert('Game Over! Your score: ' + score);
                submitScore(score);
            }

            requestAnimationFrame(updateGame);
        } else {
            console.log('Game over');
        }
    }

    function createBlock(xPos) {
        let gapHeight = 250;
        let upperHeight = Math.random() * (window.innerHeight - gapHeight - 200) + 50;
        let lowerHeight = window.innerHeight - upperHeight - gapHeight;

        let upperBlock = document.createElement('div');
        upperBlock.className = 'block upper';
        upperBlock.style.height = `${upperHeight}px`;
        upperBlock.style.left = `${xPos}px`;

        let lowerBlock = document.createElement('div');
        lowerBlock.className = 'block lower';
        lowerBlock.style.height = `${lowerHeight}px`;
        lowerBlock.style.left = `${xPos}px`;

        gameContainer.appendChild(upperBlock);
        gameContainer.appendChild(lowerBlock);

        console.log('Created block at:', xPos);
    }

    function createInitialBlocks() {
        for (let i = 0; i * (blockWidth + blockSpacing) < window.innerWidth; i++) {
            createBlock(window.innerWidth + i * (blockWidth + blockSpacing));
        }
    }

    function moveBlocks() {
        let blocks = document.querySelectorAll('.block');
        blocks.forEach(block => {
            let x = parseInt(block.style.left, 10) - 2 * difficultyMultiplier;
            block.style.left = `${x}px`;
            if (x + blockWidth < 0) {
                gameContainer.removeChild(block);
            } else if (x < bird.getBoundingClientRect().left && !block.passed) {
                block.passed = true;
                updateScore();
            }
        });

        let lastBlock = blocks[blocks.length - 1];
        let lastBlockRight = parseInt(lastBlock.style.left) + blockWidth;
        if (lastBlockRight < window.innerWidth - blockSpacing) {
            createBlock(window.innerWidth);
        }
    }

    function checkCollisions() {
        let blocks = document.querySelectorAll('.block');
        blocks.forEach(block => {
            let blockRect = block.getBoundingClientRect();
            let birdRect = bird.getBoundingClientRect();

            if (blockRect.left < birdRect.right &&
                blockRect.right > birdRect.left &&
                blockRect.top < birdRect.bottom &&
                blockRect.bottom > birdRect.top) {
                gameOver = true;
                alert('Game Over! Your score: ' + score);
                submitScore(score);
            }
        });
    }
    function displayLeaderboard() {
        console.log('Fetching leaderboard...');
        fetch('/get-leaderboard')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(leaderboardData => {
                console.log('Leaderboard data received:', leaderboardData);
                leaderboardBody.innerHTML = '';
    
                if (leaderboardData.length === 0) {
                    console.log('No data in leaderboard');
                    leaderboardBody.innerHTML = '<tr><td colspan="2">No scores yet.</td></tr>';
                } else {
                    leaderboardData.forEach(user => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${user.name}</td>
                            <td>${user.score}</td>
                        `;
                        leaderboardBody.appendChild(row);
                    });
                }
    
                leaderboard.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching leaderboard:', error);
                leaderboardBody.innerHTML = '<tr><td colspan="2">Error fetching leaderboard.</td></tr>';
                leaderboard.style.display = 'block';
            });
    }
    
    function submitScore(score) {
        fetch('/update-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: playerId, score }),
        })
        .then(response => response.json())
        .then(() => {
            displayLeaderboard();
        })
        .catch(error => console.error('Error updating score:', error));
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const name = formData.get('name');
        const difficulty = formData.get('difficulty');
    
        fetch('/start-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, difficulty }),
        })
        .then(response => response.json())
        .then(data => {
            playerId = data.id;
            form.style.display = 'none';
            gameContainer.style.display = 'block';
            startGame(difficulty); 
        })
        .catch(error => console.error('Error starting game:', error));
    });
    

    document.body.addEventListener('click', flyUp);
});
