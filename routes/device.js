const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// =========================
// Registrar dispositivo
// =========================
router.post("/register", async (req, res) => {
  try {
    const { deviceCode } = req.body;

    console.log("📱 REGISTER:", deviceCode);

    if (!deviceCode) {
      return res.status(400).json({
        success: false,
        message: "Falta el código del dispositivo",
      });
    }

    const { data: existing, error } = await supabase
      .from("devices")
      .select("*")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error) throw error;

    if (existing) {
      console.log("✅ Dispositivo ya existe");

      await supabase
        .from("devices")
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq("device_code", deviceCode);

      return res.json({
        success: true,
        activated: true,
        exists: true,
      });
    }

    console.log("🆕 Registrando dispositivo...");

    const { error: insertError } = await supabase
      .from("devices")
      .insert({
        device_code: deviceCode,
      });

    if (insertError) throw insertError;

    console.log("✅ Dispositivo registrado correctamente");

    return res.json({
      success: true,
      activated: false,
      exists: false,
    });

  } catch (e) {
    console.error("❌ ERROR REGISTER:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =========================
// Comprobar dispositivo
// =========================
router.post("/check", async (req, res) => {
  try {
    const { deviceCode } = req.body;

    console.log("🔍 CHECK:", deviceCode);

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      console.log("❌ No encontrado");

      return res.json({
        success: true,
        activated: false,
      });
    }

    console.log("✅ Dispositivo encontrado");

    return res.json({
      success: true,
      activated: true,
    });

  } catch (e) {
    console.error("❌ ERROR CHECK:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;