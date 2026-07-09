const express = require('express');
const { getPublicDoctors } = require('../controllers/doctorController');

const router = express.Router();

router.get('/public', getPublicDoctors);

module.exports = router;
