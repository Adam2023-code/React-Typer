const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// const dbGet = (query, params = []) => {
//     return new Promise((resolve, reject) => {
//         db.get(query, params, (err, row) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(row);
//             }
//         });
//     });
// };

// const dbRun = (query, params = []) => {
//     return new Promise((resolve, reject) => {
//         db.run(query, params, function (err) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(this);
//             }
//         });
//     });
// };

// module.exports = { db, dbGet, dbRun };

db.serialize (() => {
    db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table is ready.');
        }
    });
});

module.exports = db;