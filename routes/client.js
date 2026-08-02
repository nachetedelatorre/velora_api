const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// =========================
// Crear cliente
// =========================
router.post("/create", async (req, res) => {
  try {
    const {
      resellerId,
      username,
      password,
    } = req.body;

    if (!resellerId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        reseller_id: resellerId,
        username,
        password,
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      client: data,
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
// Obtener clientes
// =========================
router.get("/all/:resellerId", async (req, res) => {
  try {
    const { resellerId } = req.params;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("reseller_id", resellerId)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return res.json({
      success: true,
      clients: data,
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