const express = require('express');
const eventController = require('../controllers/eventController');
const verifySignature = require('../middleware/verifySignature');

const router = express.Router();

router.post('/', verifySignature, eventController.store);
router.get('/', eventController.index);

module.exports = router;
