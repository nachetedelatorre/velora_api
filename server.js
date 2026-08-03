const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./services/supabase");

const deviceRoutes = require("./routes/device");
const playlistRoutes = require("./routes/playlist");
const authRoutes = require("./routes/auth");
const resellerRoutes = require("./routes/reseller");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Velora API funcionando 🚀",
  });
});

app.get("/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("devices")
      .select("*");

    if (error) throw error;

    res.json({
      success: true,
      devices: data,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
});

// =========================
// Rutas
// =========================

app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);
app.use("/playlist", playlistRoutes);
app.use("/reseller", resellerRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Velora API iniciada en http://localhost:${PORT}`);
});