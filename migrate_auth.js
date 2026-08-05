const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log('Migrando columnas de autenticación...');

    const queries = [
        "ALTER TABLE usuarios ADD COLUMN reset_token TEXT",
        "ALTER TABLE usuarios ADD COLUMN reset_token_expiry DATETIME"
    ];

    queries.forEach(query => {
        db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error:', err.message);
            } else {
                console.log('Columna OK');
            }
        });
    });
});

setTimeout(() => {
    db.close();
    console.log('Migración finalizada.');
}, 1000);
