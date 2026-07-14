const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// =========================
// Login
// =========================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(401).json({
        success: false,
        message: "Usuario incorrecto",
      });
    }

    if (data.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    return res.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        role: data.role,
        credits: data.credits,
      },
    });

  } catch (e) {
    console.error("LOGIN ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;