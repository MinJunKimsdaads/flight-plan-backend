import express from 'express';
import corsConfig from './config/corsConfig.js';
import dotenv from 'dotenv';
import aircraftRoutes from './routes/aircraftRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(corsConfig);
app.use(express.json());

app.use('/api',aircraftRoutes);

app.listen(PORT,()=>{
    console.log('server running');
});