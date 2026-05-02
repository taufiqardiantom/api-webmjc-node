const express = require('express');
const router = express.Router();
const statusController = require('../../controllers/master/statusController');

router.get('/', statusController.get);

module.exports = router;