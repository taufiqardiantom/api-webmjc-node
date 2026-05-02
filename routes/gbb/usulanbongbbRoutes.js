const express = require('express');
const router = express.Router();
const usulanbongbbController = require('../../controllers/gbb/usulanbongbbController');

router.post('/', usulanbongbbController.get);
router.post('/byusulan', usulanbongbbController.getByUsulan);

router.get('/alasan', usulanbongbbController.alasan);

router.post('/create', usulanbongbbController.create);
router.post('/update', usulanbongbbController.update);
router.post('/cancel', usulanbongbbController.cancel);

module.exports = router;