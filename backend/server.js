const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const fetch = require('node-fetch');
const app = express();
const port = 4000;
const url = "mongodb+srv://donvitog981:mongodb123@cluster0.kqipm.mongodb.net/";

// Middleware
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Database connesso con successo!'))
    .catch(err => console.log('❌ Errore connessione DB: ' + err));

const userRoutes = require('./route/userRoutes.js');

app.use('/api/users', userRoutes);



app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server in ascolto su http://localhost:${port}`);
});
