const { sql, pool } = require('../../config/db');

// GET ALL
exports.get = async (req, res) => {

    try {
        const db = await pool;

        const { recordset: data } = await db.request()
            .query(`
        SELECT*FROM v_costcenter ORDER BY sort_group, bagian, nama_group, nama
      `);

        return res.status(200).json({
            data,
            message: 'Load Cost Center Berhasil',
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Load Cost Center Gagal',
        });
    }
};