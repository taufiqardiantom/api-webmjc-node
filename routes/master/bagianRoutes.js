const express = require('express');
const router = express.Router();
const bagianController = require('../../controllers/master/bagianController');

router.get('/', bagianController.get);

module.exports = router;