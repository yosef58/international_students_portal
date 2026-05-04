import express  from 'express';
import cors  from 'cors';
// import dotenv from 'dotenv';
import connectDB  from './config/db.js';
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit'; 

import authRoutes  from './routes/authRoutes.js';
import serviceRoutes  from './routes/serviceRoutes.js';
import requestRoutes  from './routes/requestRoutes.js';
import eventRoutes  from './routes/eventRoutes.js';
import reportRoutes  from './routes/reportRoutes.js';
import notificationRoutes  from './routes/notificationRoutes.js';
// import messageRoutes from './routes/messageRoutes.js';
import httpstatustext from './utils/httpstatustext.js';


if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}
connectDB();

const app = express();

app.set('trust proxy', 1);

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://internationalstudentsportal-production-5e18.up.railway.app"
    ],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "trusted.com"],
      },
    },
  })
);

// ALL Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
// app.use('/api/messages', messageRoutes);


app.use((err,req,res,next)=>{
  console.error('Global error:', err); // 👈 add this line
  res.status(err.StatusCode||500).json({status :err.StatusText||httpstatustext.ERROR,message:err.message})
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
