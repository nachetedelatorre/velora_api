const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");

const {
  getPlaylist,
  getPlaylistJson,
  clearPlaylistCache,
} = require("../services/playlistService");

// ======================================
// Crear o actualizar playlist
// ======================================

router.post("/save", async (req, res) => {
  try {
    const { deviceCode, name, url } = req.body;

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

    // Si cambia la URL, borrar cache
    if (existing && existing.url !== url) {
      clearPlaylistCache(existing.url);
    }

    if (existing) {
      const { error } = await supabase
        .from("playlists")
        .update({
          name,
          url,
          updated_at: new Date().toISOString(),
        })
        .eq("device_code", deviceCode);

      if (error) throw error;

      return res.json({
        success: true,
        updated: true,
      });
    }

    const { error } = await supabase
      .from("playlists")
      .insert({
        device_code: deviceCode,
        name,
        url,
      });

    if (error) throw error;

    return res.json({
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
// Playlist clásica (compatibilidad)
// ======================================

router.get("/:deviceCode", async (req, res) => {
  try {
    const result = await getPlaylist(req.params.deviceCode);

    if (result.expired) {
      return res.status(403).json({
        success: false,
        expired: true,
        message: "Licencia caducada",
      });
    }

    res.json({
      success: true,
      playlist: result.playlist,
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
// Nuevo endpoint JSON
// ======================================

router.get("/json/:deviceCode", async (req, res) => {
  try {
    const json = await getPlaylistJson(req.params.deviceCode);

    res.json(json);

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
    const { data } = await supabase
      .from("playlists")
      .select("url")
      .eq("device_code", req.params.deviceCode)
      .maybeSingle();

    if (data) {
      clearPlaylistCache(data.url);
    }

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("device_code", req.params.deviceCode);

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