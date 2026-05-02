const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());

//-------------------------------------------------------------------------------------------------------------------//
const userRoutes = require('./routes/userRoutes');

//MASTER
const bahanbakuRoutes = require('./routes/master/bahanbakuRoutes');
const costcenterRoutes = require('./routes/master/costcenterRoutes');
const bagianRoutes = require('./routes/master/bagianRoutes');
const statusRoutes = require('./routes/master/statusRoutes');


//GBB //USULAN BON
const usulanbongbbRoutes = require('./routes/gbb/usulanbongbbRoutes');

//-------------------------------------------------------------------------------------------------------------------//
app.use('/api/users', userRoutes);

//MASTER
app.use('/api/master/bahanbaku', bahanbakuRoutes);
app.use('/api/master/costcenter', costcenterRoutes);
app.use('/api/master/bagian', bagianRoutes);
app.use('/api/master/status', statusRoutes);

//GBB //USULAN BON
app.use('/api/gbb/usulanbon', usulanbongbbRoutes);



//-------------------------------------------------------------------------------------------------------------------//
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});