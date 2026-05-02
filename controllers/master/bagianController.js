const { sql, pool } = require('../../config/db');

// GET ALL
exports.get = async (req, res) => {
    
    try {
        const db = await pool;

        const { recordset: data } = await db.request()
            .query(`
        SELECT DISTINCT kode_bagian, nama_dept,nama_bagian, kode_perk FROM v_bagian_departemen ORDER BY nama_bagian
      `);

        return res.status(200).json({
            data,
            message: 'Load Bagian Personalia Berhasil',
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Load Bagian Personalia Gagal',
        });
    }
};