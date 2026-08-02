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

// =========================
// Añadir créditos
// =========================
router.post("/add-credits", async (req, res) => {
  try {
    const { resellerId, credits } = req.body;

    if (!resellerId || credits == null) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    const { data: reseller, error: searchError } = await supabase
      .from("resellers")
      .select("credits")
      .eq("id", resellerId)
      .single();

    if (searchError) throw searchError;

    const totalCredits =
      Number(reseller.credits) + Number(credits);

    const { data, error } = await supabase
      .from("resellers")
      .update({
        credits: totalCredits,
      })
      .eq("id", resellerId)
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
// Eliminar revendedor
// =========================
router.post("/delete", async (req, res) => {
  try {
    const { resellerId } = req.body;

    if (!resellerId) {
      return res.status(400).json({
        success: false,
        message: "Falta el ID del revendedor",
      });
    }

    // Obtener el user_id asociado
    const { data: reseller, error: resellerError } =
      await supabase
        .from("resellers")
        .select("user_id")
        .eq("id", resellerId)
        .single();

    if (resellerError) throw resellerError;

    // Eliminar revendedor
    const { error: deleteResellerError } =
      await supabase
        .from("resellers")
        .delete()
        .eq("id", resellerId);

    if (deleteResellerError) throw deleteResellerError;

    // Eliminar usuario
    const { error: deleteUserError } =
      await supabase
        .from("users")
        .delete()
        .eq("id", reseller.user_id);

    if (deleteUserError) throw deleteUserError;

    return res.json({
      success: true,
      message: "Revendedor eliminado correctamente",
    });

  } catch (e) {
    console.error("DELETE RESELLER ERROR");
    console.error(e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;