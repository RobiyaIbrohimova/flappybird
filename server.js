const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'flappybird'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

app.post('/start-game', (req, res) => {
    const { name, difficulty } = req.body;
    const query = 'INSERT INTO users (name, difficulty, score) VALUES (?, ?, 0)';
    db.query(query, [name, difficulty], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId });
    });
});

app.post('/update-score', (req, res) => {
    const { id, score } = req.body;
    const query = 'UPDATE users SET score = ? WHERE id = ?';
    db.query(query, [score, id], (err) => {
        if (err) throw err;
        updateTopScores(() => {
            getLeaderboard((leaderboardData) => {
                res.json(leaderboardData);
            });
        });
    });
});

function updateTopScores(callback) {
    db.query('DELETE FROM top_scores', (err) => {
        if (err) throw err;

        const query = `
            INSERT INTO top_scores (user_id, score)
            SELECT id, MAX(score) as max_score FROM users
            GROUP BY id
            ORDER BY max_score DESC
            LIMIT 10
        `;
        db.query(query, (err) => {
            if (err) throw err;
            if (callback) callback();
        });
    });
}

// Function to get the leaderboard
function getLeaderboard(callback) {
    const query = `
        SELECT users.name, top_scores.score
        FROM top_scores
        JOIN users ON top_scores.user_id = users.id
        ORDER BY top_scores.score DESC
        LIMIT 10
    `;
    db.query(query, (err, results) => {
        if (err) throw err;
        callback(results);
    });
}

app.get('/get-leaderboard', (req, res) => {
    getLeaderboard((results) => {
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
