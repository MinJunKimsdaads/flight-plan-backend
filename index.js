import express from 'express';
import corsConfig from './config/corsConfig.js';
import dotenv from 'dotenv';
import aircraftRoutes from './routes/aircraftRoutes.js';
import currentRoutes from './routes/currentRoutes.js';
import airportRoutes from './routes/airportRoutes.js';
import commonRoutes from './routes/commonRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(corsConfig);
app.use(express.json());

app.use('/api',aircraftRoutes);
app.use('/api',currentRoutes);
app.use('/api',airportRoutes);
app.use('/api',commonRoutes);

app.listen(PORT,()=>{
    console.log('server running');
});