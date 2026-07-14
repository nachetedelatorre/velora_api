const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// =========================
// Crear revendedor
// =========================
router.post("/create", async (req, res) => {
  try {
    const {
      username,
      password,
      credits,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    // Comprobar si ya existe
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Ese usuario ya existe",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        password,
        role: "reseller",
        credits: credits ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      reseller: data,
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =========================
// Obtener revendedores
// =========================
router.get("/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "reseller")
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return res.json({
      success: true,
      resellers: data,
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;