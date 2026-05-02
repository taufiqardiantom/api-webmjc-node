const express = require('express');
const router = express.Router();
const bahanbakuController = require('../../controllers/master/bahanbakuController');

router.post('/', bahanbakuController.get);
router.get('/kategori', bahanbakuController.getKategori);

module.exports = router;