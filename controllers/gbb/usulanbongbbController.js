const { sql, pool } = require('../../config/db');

// GET ALL
exports.get = async (req, res) => {
    try {
        const { tanggal1, tanggal2, kode_dept } = req.body;

        const db = await pool;

        // ======================
        // QUERY HEADER
        // ======================
        const headerResult = await db.request()
            .input('tanggal1', sql.Date, tanggal1)
            .input('tanggal2', sql.Date, tanggal2)
            .input('kode_dept', sql.VarChar, kode_dept)
            .query(`
                SELECT 
                    A.no_usulan, A.tgl_usulan, A.nik_pembuat,
                    C.nama,
                    A.bagian_pembuat, B.nama_bagian,
                    A.bagian_beban,
                    ISNULL(D.nama_bagian,E.nama_bagian) AS nama_bagian_beban,
                    A.ket_usulan, A.sta_aktif, A.ket_cancel, A.created_at,
                    IIF(F.no_usulan IS NOT NULL, 1, 0) AS sta_realisasi
                FROM tbl_usulan_bon_gbb A
                LEFT JOIN v_bagian_departemen B ON A.bagian_pembuat = B.kode_bagian
                LEFT JOIN tbl_v_karyawan C ON A.nik_pembuat = C.nik
                LEFT JOIN v_bagian_departemen D ON A.bagian_beban = D.kode_bagian
                LEFT JOIN tbl_department_tambah E ON A.bagian_beban = E.kd_bagian
                LEFT JOIN (
                    SELECT DISTINCT no_usulan
                    FROM tbl_PengeluaranBahanDoc
                    WHERE no_usulan LIKE '%/BON/%'
                ) F ON A.no_usulan = F.no_usulan
                WHERE A.sta_aktif = 1
                AND A.tgl_usulan BETWEEN @tanggal1 AND @tanggal2
                AND B.kode_dept = @kode_dept
                ORDER BY A.tgl_usulan DESC, A.no_usulan DESC
            `);

        // console.log(req.query);

        const data = headerResult.recordset;

        // ======================
        // AMBIL LIST NO_USULAN
        // ======================
        const noUsulanList = data.map(d => d.no_usulan);

        if (noUsulanList.length === 0) {
            return res.json({
                data: [],
                message: 'Load List Usulan Bon GBB Berhasil'
            });
        }

        // ======================
        // QUERY DETAIL
        // ======================
        const requestDetail = db.request();

        // dynamic parameter binding
        const params = noUsulanList.map((val, i) => {
            requestDetail.input(`no${i}`, sql.VarChar, val);
            return `@no${i}`;
        }).join(',');

        const detailResult = await requestDetail.query(`
            SELECT 
                A.no_usulan, A.urut, A.kode_bahan,
                B.nama_bahan, B.ukuran, B.unit,
                A.jumlah, A.kegunaan,
                D.nama AS nama_kegunaan,
                A.keterangan, A.bagian_beban
            FROM tbl_usulan_bon_gbb_detail A
            LEFT JOIN tbl_bahanbaku B ON A.kode_bahan = B.kode_bahan
            LEFT JOIN v_costcenter D ON A.kegunaan = D.kode
            WHERE A.no_usulan IN (${params})
        `);

        const details = detailResult.recordset;

        // ======================
        // GROUPING DETAIL
        // ======================
        const detailGrouped = {};
        details.forEach(d => {
            if (!detailGrouped[d.no_usulan]) {
                detailGrouped[d.no_usulan] = [];
            }
            detailGrouped[d.no_usulan].push(d);
        });

        // ======================
        // MERGE HEADER + DETAIL
        // ======================
        const finalData = data.map(row => ({
            ...row,
            detail: detailGrouped[row.no_usulan] || []
        }));

        return res.json({
            data: finalData,
            message: 'Load List Usulan Bon GBB Berhasil'
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message,
            message: 'Load List Usulan Bon GBB Gagal'
        });
    }
};


// GET BY NO USULAN
exports.getByUsulan = async (req, res) => {
    try {
        const { no_usulan } = req.body;

        const db = await pool;
        const [data, detail] = await Promise.all([
            db.request()
                .input('no_usulan', sql.VarChar, no_usulan)
                .query(`
          SELECT 
            A.no_usulan, A.tgl_usulan, A.nik_pembuat, C.nama,
            A.bagian_pembuat, B.nama_bagian, A.bagian_beban,
            ISNULL(D.nama_bagian, E.nama_bagian) AS nama_bagian_beban,
            A.ket_usulan, A.sta_aktif, A.ket_cancel, A.created_at
          FROM tbl_usulan_bon_gbb A
          LEFT JOIN v_bagian_departemen B ON A.bagian_pembuat = B.kode_bagian
          LEFT JOIN v_karyawan C ON A.nik_pembuat = C.nik
          LEFT JOIN v_bagian_departemen D ON A.bagian_beban = D.kode_bagian
          LEFT JOIN tbl_department_tambah E ON A.bagian_beban = E.kd_bagian
          WHERE A.sta_aktif = '1' AND A.no_usulan = @no_usulan
        `),

            db.request()
                .input('no_usulan', sql.VarChar, no_usulan)
                .query(`
          SELECT
            A.no_usulan, A.urut, A.kode_bahan, B.nama_bahan,
            B.ukuran, B.unit, A.jumlah, A.alasan, A.kegunaan,
            D.nama AS nama_kegunaan, A.keterangan,
            A.bagian_beban AS kode_bagian, C.nama_bagian,
            C.kode_dept, C.nama_dept
          FROM tbl_usulan_bon_gbb_detail A
          LEFT JOIN tbl_bahanbaku B ON A.kode_bahan = B.kode_bahan
          LEFT JOIN v_bagian_departemen C ON A.bagian_beban = C.kode_bagian
          LEFT JOIN v_costcenter D ON A.kegunaan = D.kode
          WHERE A.no_usulan = @no_usulan
        `)
        ]);

        // Group details by no_usulan using a Map (O(n) lookup)
        const detailMap = detail.recordset.reduce((map, row) => {
            if (!map.has(row.no_usulan)) map.set(row.no_usulan, []);
            map.get(row.no_usulan).push(row);
            return map;
        }, new Map());

        const result = data.recordset.map((item) => ({
            ...item,
            detail: detailMap.get(item.no_usulan) ?? [],
        }));

        return res.status(200).json({
            data: result,
            message: 'Load List Usulan Bon GBB Berhasil',
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Load List Usulan Bon GBB Gagal',
        });
    }
};

// GET ALASAN
exports.alasan = async (req, res) => {
    try {
        const data = ['Perbaikan', 'Penggantian', 'Perawatan', 'Modifikasi'];

        return res.status(200).json({
            data,
            message: 'Load List Alasan Spare Part Usulan Bon GBB Berhasil',
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: 'Load List Alasan Spare Part Usulan Bon GBB Gagal',
        });
    }
};


//CREATE
exports.create = async (req, res) => {

    const { nik, kode_bagian, kode_bagian_beban, ket_usulan, items } = req.body;

    const resolvedPool = await pool; // await dulu!
    const db = new sql.Transaction(resolvedPool);
    try {
        await db.begin();

        // Generate no_usulan
        const { recordset: [{ no_max }] } = await db.request().query(`
      SELECT 
        RIGHT('0000' + CONVERT(VARCHAR, ISNULL(MAX(LEFT(no_usulan, 4)), 0) + 1), 4)
        + '/BON/'
        + RIGHT('00' + CONVERT(VARCHAR, MONTH(GETDATE())), 2)
        + '/' + CONVERT(VARCHAR, YEAR(GETDATE())) AS no_max
      FROM tbl_usulan_bon_gbb
      WHERE YEAR(tgl_usulan)  = YEAR(GETDATE())
        AND MONTH(tgl_usulan) = MONTH(GETDATE())
    `);

        // Insert header
        await db.request()
            .input('no_usulan', sql.VarChar, no_max)
            .input('nik_pembuat', sql.VarChar, nik)
            .input('bagian_pembuat', sql.VarChar, kode_bagian)
            .input('bagian_beban', sql.VarChar, kode_bagian_beban)
            .input('ket_usulan', sql.VarChar, ket_usulan)
            .query(`
        INSERT INTO tbl_usulan_bon_gbb 
          (no_usulan, tgl_usulan, nik_pembuat, bagian_pembuat, bagian_beban, ket_usulan)
        VALUES 
          (@no_usulan, GETDATE(), @nik_pembuat, @bagian_pembuat, @bagian_beban, @ket_usulan)
      `);

        // Insert details (parallel)
        // ✅ BENAR - sequential
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            await db.request()
                .input('no_usulan', sql.VarChar, no_max)
                .input('kode_bahan', sql.VarChar, item.kode_bahan)
                .input('jumlah', sql.Decimal, item.jumlah)
                .input('alasan', sql.VarChar, item.alasan)
                .input('kegunaan', sql.VarChar, item.kegunaan)
                .input('keterangan', sql.VarChar, item.keterangan)
                .input('urut', sql.Int, index + 1)
                .query(`
            INSERT INTO tbl_usulan_bon_gbb_detail
              (no_usulan, kode_bahan, jumlah, alasan, kegunaan, keterangan, urut)
            VALUES
              (@no_usulan, @kode_bahan, @jumlah, @alasan, @kegunaan, @keterangan, @urut)
        `);
        }

        await db.commit();

        return res.status(200).json({
            data: no_max,
            message: 'Simpan Data Usulan Bon Berhasil',
        });

    } catch (error) {
        await db.rollback();
        // logger.error(`CREATE USULAN BON GBB GAGAL | ${JSON.stringify(req.body)} | ${error.message}`);

        return res.status(500).json({
            error: error.message,
            message: 'Simpan Data Usulan Bon Gagal',
        });
    }

};

// CANCEL
exports.cancel = async (req, res) => {
    const { no_usulan, ket_batal, nik, nama_bagian } = req.body;
    const db = await pool;
    try {
        await db.request()
            .input('no_usulan', sql.VarChar, no_usulan)
            .input('sta_aktif', sql.VarChar, '0')
            .input('ket_cancel', sql.VarChar, `${ket_batal};${nik};${nama_bagian}`)
            .query(`
        UPDATE tbl_usulan_bon_gbb
        SET 
          sta_aktif  = @sta_aktif,
          ket_cancel = CONCAT(@ket_cancel, ';', GETDATE())
        WHERE no_usulan = @no_usulan
      `);

        // logger.info(`DEVELOPMENT Cancel Usulan Bon Gudang | ${JSON.stringify(req.body)} | ${req.ip}`);

        return res.status(200).json({
            data: no_usulan,
            message: `Pembatalan Usulan Bon Gudang ${no_usulan} Berhasil`,
        });

    } catch (error) {
        // logger.error(`DEVELOPMENT Cancel Usulan Bon Gudang | ${JSON.stringify(req.body)} | ${req.ip} | ${error.message}`);

        return res.status(400).json({
            error: error.message,
            message: 'Pembatalan Usulan Bon Gudang Gagal',
        });
    }
};


exports.update = async (req, res) => {
    const { no_usulan, nik, kode_bagian, kode_bagian_beban, ket_usulan, items } = req.body;

    const resolvedPool = await pool;
    const db = new sql.Transaction(resolvedPool);

    try {
        await db.begin();

        // Update header
        await db.request()
            .input('no_usulan', sql.VarChar, no_usulan)
            .input('nik_pembuat', sql.VarChar, nik)
            .input('bagian_pembuat', sql.VarChar, kode_bagian)
            .input('bagian_beban', sql.VarChar, kode_bagian_beban)
            .input('ket_usulan', sql.VarChar, ket_usulan)
            .query(`
                UPDATE tbl_usulan_bon_gbb SET
                  nik_pembuat    = @nik_pembuat,
                  bagian_pembuat = @bagian_pembuat,
                  bagian_beban   = @bagian_beban,
                  ket_usulan     = @ket_usulan
                WHERE no_usulan = @no_usulan
            `);

        // Delete detail lama
        await db.request()
            .input('no_usulan', sql.VarChar, no_usulan)
            .query(`DELETE FROM tbl_usulan_bon_gbb_detail WHERE no_usulan = @no_usulan`);

        // ✅ Insert detail baru - sequential
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            await db.request()
                .input('no_usulan', sql.VarChar, no_usulan)
                .input('kode_bahan', sql.VarChar, item.kode_bahan)
                .input('jumlah', sql.Decimal, item.jumlah)
                .input('alasan', sql.VarChar, item.alasan)
                .input('kegunaan', sql.VarChar, item.kegunaan)
                .input('keterangan', sql.VarChar, item.keterangan)
                .input('urut', sql.Int, index + 1)
                .query(`
                    INSERT INTO tbl_usulan_bon_gbb_detail
                      (no_usulan, kode_bahan, jumlah, alasan, kegunaan, keterangan, urut)
                    VALUES
                      (@no_usulan, @kode_bahan, @jumlah, @alasan, @kegunaan, @keterangan, @urut)
                `);
        }

        await db.commit();

        return res.status(200).json({
            data: no_usulan,
            message: `Perubahan Usulan Bon Gudang ${no_usulan} Berhasil`,
        });

    } catch (error) {
        await db.rollback(); // ✅ Fix: db bukan transaction
        return res.status(400).json({
            error: error.message,
            message: 'Perubahan Usulan Bon Gudang Gagal',
        });
    }
};