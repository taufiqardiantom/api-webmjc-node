const { sql, pool } = require('../../config/db');

exports.get = async (req, res) => {
    try {
        const data = ['Reguler', 'Urgent', 'Top Urgent'];

        return res.status(200).json({
            data,
            message: 'Load Kategori Status Usulan Berhasil',
        });

    } catch (error) {
        return res.status(400).json({
            error: error.message,
            message: 'Load Kategori Status Usulan Gagal',
        });
    }
};