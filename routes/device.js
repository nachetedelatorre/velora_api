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

    const now = new Date();

    const trialEnd = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const { error: insertError } = await supabase
      .from("devices")
      .insert({
        device_code: deviceCode,
        subscription_type: "trial",
        subscription_start: now.toISOString(),
        subscription_end: trialEnd.toISOString(),
        last_seen: now.toISOString(),
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

    if (!deviceCode) {
      return res.status(400).json({
        success: false,
        message: "Falta el código del dispositivo",
      });
    }

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({
        success: true,
        activated: false,
        exists: false,
        reason: "not_registered",
      });
    }

    const now = new Date();
    const end = new Date(data.subscription_end);

    const active = end > now;

    await supabase
      .from("devices")
      .update({
        last_seen: now.toISOString(),
      })
      .eq("device_code", deviceCode);

    return res.json({
      success: true,
      exists: true,
      activated: active,
      expired: !active,
      subscriptionType: data.subscription_type,
      subscriptionStart: data.subscription_start,
      subscriptionEnd: data.subscription_end,
    });

  } catch (e) {
    console.error("❌ ERROR CHECK:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =========================
// Obtener suscripción
// =========================
router.get("/subscription/:deviceCode", async (req, res) => {
  try {
    const { deviceCode } = req.params;

    const { data, error } = await supabase
      .from("devices")
      .select(
        "subscription_type, subscription_start, subscription_end"
      )
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Dispositivo no encontrado",
      });
    }

    return res.json({
      success: true,
      subscription: data,
    });

  } catch (e) {
    console.error("❌ ERROR SUBSCRIPTION:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// =========================
// Activar licencia 1 año
// =========================
router.post("/activate", async (req, res) => {
  try {
    const { deviceCode, resellerId } = req.body;

    if (!deviceCode || !resellerId) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    // Buscar revendedor
    const { data: reseller, error: resellerError } =
      await supabase
        .from("resellers")
        .select("credits")
        .eq("id", resellerId)
        .single();

    if (resellerError) throw resellerError;

    if (Number(reseller.credits) <= 0) {
      return res.json({
        success: false,
        message: "No tienes créditos disponibles",
      });
    }

    const now = new Date();

    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);

    // Activar dispositivo
    const { data: device, error: deviceError } =
      await supabase
        .from("devices")
        .update({
          reseller_id: resellerId,
          subscription_type: "yearly",
          subscription_start: now.toISOString(),
          subscription_end: end.toISOString(),
          last_seen: now.toISOString(),
        })
        .eq("device_code", deviceCode)
        .select()
        .single();

    if (deviceError) throw deviceError;

    // Restar un crédito
    const { error: creditError } =
      await supabase
        .from("resellers")
        .update({
          credits: Number(reseller.credits) - 1,
        })
        .eq("id", resellerId);

    if (creditError) throw creditError;

    return res.json({
      success: true,
      device,
    });

  } catch (e) {
    console.error("❌ ERROR ACTIVATE:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;