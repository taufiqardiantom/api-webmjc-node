const express = require('express');
const router = express.Router();
const costcenterController = require('../../controllers/master/costcenterController');

router.get('/', costcenterController.get);

module.exports = router;