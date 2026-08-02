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

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario incorrecto",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    let resellerId = null;
    let credits = 0;

    // Si es revendedor obtenemos sus datos
    if (user.role === "reseller") {
      const { data: reseller, error: resellerError } =
        await supabase
          .from("resellers")
          .select("id, credits")
          .eq("user_id", user.id)
          .maybeSingle();

      if (resellerError) throw resellerError;

      if (reseller) {
        resellerId = reseller.id;
        credits = reseller.credits;
      }
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        reseller_id: resellerId,
        credits: credits,
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