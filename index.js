const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/',(req, res)=>{
    res.send('flight-plan');
});

app.listen(PORT,()=>{
    console.log('server running');
});