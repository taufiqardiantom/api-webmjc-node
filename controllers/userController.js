const { sql, pool } = require('../config/db');

// GET ALL
exports.getUsers = async (req, res) => {
    try {
        const db = await pool;
        const result = await db.request().query("SELECT * FROM users");

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET BY ID (SAFE)
exports.getUserById = async (req, res) => {
    try {
        const db = await pool;

        const result = await db.request()
            .input('id', sql.Int, req.params.id) // ✅ anti injection
            .query("SELECT * FROM users WHERE id = @id");

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// CREATE (SAFE)
exports.createUser = async (req, res) => {
    try {
        const { name, email } = req.body;

        const db = await pool;

        await db.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .query(`
                INSERT INTO users (name, email)
                VALUES (@name, @email)
            `);

        res.json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};