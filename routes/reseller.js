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

    console.log("========== CREAR REVENDEDOR ==========");
    console.log(req.body);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    // ¿Existe ya el usuario?
    const { data: existing, error: existingError } =
      await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    console.log("EXISTING:", existing);
    console.log("EXISTING ERROR:", existingError);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Ese usuario ya existe",
      });
    }

    // Crear usuario
    const { data: user, error: userError } =
      await supabase
        .from("users")
        .insert({
          username,
          password,
          role: "reseller",
        })
        .select()
        .single();

    console.log("USER:");
    console.log(user);

    console.log("USER ERROR:");
    console.log(userError);

    if (userError) throw userError;

    // Crear revendedor
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

    console.log("RESELLER:");
    console.log(reseller);

    console.log("RESELLER ERROR:");
    console.log(resellerError);

    if (resellerError) throw resellerError;

    console.log("========== OK ==========");

    return res.json({
      success: true,
      user,
      reseller,
    });

  } catch (e) {
    console.error("========== ERROR ==========");
    console.error(e);

    return res.status(500).json({
      success: false,
      message: e.message,
      error: e,
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

    console.log("GET RESELLERS");
    console.log(data);
    console.log(error);

    if (error) throw error;

    return res.json({
      success: true,
      resellers: data,
    });

  } catch (e) {
    console.error("GET RESELLERS ERROR");
    console.error(e);

    return res.status(500).json({
      success: false,
      message: e.message,
      error: e,
    });
  }
});

module.exports = router;