const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

// ======================================
// Crear o actualizar playlist
// ======================================
router.post("/save", async (req, res) => {
  try {
    const { deviceCode, name, url } = req.body;

    console.log("💾 SAVE PLAYLIST");
    console.log(deviceCode);
    console.log(name);
    console.log(url);

    if (!deviceCode || !name || !url) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos",
      });
    }

    const { data: existing, error: searchError } = await supabase
      .from("playlists")
      .select("*")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("playlists")
        .update({
          name,
          url,
          updated_at: new Date().toISOString(),
        })
        .eq("device_code", deviceCode);

      if (updateError) throw updateError;

      return res.json({
        success: true,
        updated: true,
      });
    }

    const { error: insertError } = await supabase
      .from("playlists")
      .insert({
        device_code: deviceCode,
        name,
        url,
      });

    if (insertError) throw insertError;

    res.json({
      success: true,
      updated: false,
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// ======================================
// Obtener playlist del dispositivo
// ======================================
router.get("/:deviceCode", async (req, res) => {
  try {
    const { deviceCode } = req.params;

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("device_code", deviceCode)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({
        success: true,
        playlist: null,
      });
    }

    res.json({
      success: true,
      playlist: data,
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// ======================================
// Eliminar playlist
// ======================================
router.delete("/:deviceCode", async (req, res) => {
  try {
    const { deviceCode } = req.params;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("device_code", deviceCode);

    if (error) throw error;

    res.json({
      success: true,
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;