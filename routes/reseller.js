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
      companyName,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    // ¿Existe ya el usuario?
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

    // Crear usuario
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        username,
        password,
        role: "reseller",
      })
      .select()
      .single();

    if (userError) throw userError;

    // Crear perfil de revendedor
    const { data: reseller, error: resellerError } =
      await supabase
        .from("resellers")
        .insert({
          user_id: user.id,
          company_name: companyName ?? username,
          credits: credits ?? 0,
          active: true,
        })
        .select()
        .single();

    if (resellerError) throw resellerError;

    return res.json({
      success: true,
      user,
      reseller,
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
      .from("resellers")
      .select(`
        *,
        users (
          username
        )
      `)
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