const { sql, pool } = require('../../config/db');


// GET ALL BAHANBAKU
exports.get = async (req, res) => {

    try {
        const { search } = req.body;
        const db = await pool;

        const { recordset: data }  = await db.request()
            .input('search', sql.VarChar, `%${search}%`)
            .query(`
        SELECT TOP 1000 *
        FROM v_bahanbaku
        WHERE LEFT(kode_bahan, 6) <> '120-01'
          AND (
            kode_bahan          LIKE @search OR
            nama_bahan + ' ' + ukuran LIKE @search
          )
        ORDER BY kode_bahan
      `);

        return res.status(200).json({
            data,
            message: 'Load Bahan Berhasil',
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Load Bahan Gagal',
        });
    }
};

// GET KATEGORI BAHAN
exports.getKategori = async (req, res) => {
    try {
        const data = ['120-02', '120-03', '120-04', '120-05', '120-06', '120-07', '120-08'];

        return res.status(200).json({
            data,
            message: 'Load Kategori Bahan Berhasil',
        });

    } catch (error) {
        return res.status(400).json({
            error: error.message,
            message: 'Load Kategori Bahan Gagal',
        });
    }
};