require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const vendorRoutes = require('./routes/vendorRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 5000;


// MIDDLEWARE
app.use(cors());
app.use(express.json());

// SERVE FRONTEND
app.use(express.static("public"));

// ROUTES
app.use('/api/vendor', vendorRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/user',userRoutes);
app.use('/api/search',searchRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

console.log("RAW MONGO_URI VALUE >>>", process.env.MONGO_URI);
// MONGODB CONNECTION
mongoose
  .connect(process.env.MONGO_URI.trim())
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('MongoDB error:', err));

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
