const axios = require("axios");
const { parseM3U } = require("./m3uParser");
const supabase = require("./supabase");

// =====================================
// Cache en memoria
// =====================================

const playlistCache = new Map();

const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

// =====================================
// Obtener dispositivo y playlist
// =====================================

async function getPlaylist(deviceCode) {
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("subscription_end")
    .eq("device_code", deviceCode)
    .maybeSingle();

  if (deviceError) throw deviceError;

  if (!device) {
    throw new Error("Dispositivo no encontrado");
  }

  if (new Date(device.subscription_end) <= new Date()) {
    return {
      expired: true,
    };
  }

  const { data: playlist, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("device_code", deviceCode)
    .maybeSingle();

  if (error) throw error;

  return {
    expired: false,
    playlist,
  };
}

// =====================================
// Cache
// =====================================

function getCache(url) {
  const cache = playlistCache.get(url);

  if (!cache) return null;

  const expired =
    Date.now() - cache.timestamp > CACHE_TIME;

  if (expired) {
    playlistCache.delete(url);
    return null;
  }

  return cache.categories;
}

function saveCache(url, categories) {
  playlistCache.set(url, {
    timestamp: Date.now(),
    categories,
  });
}

function clearPlaylistCache(url) {
  playlistCache.delete(url);

  console.log("🗑 Cache eliminada");
}

async function refreshPlaylist(url) {
  clearPlaylistCache(url);

  return await loadPlaylist(url);
}

// =====================================
// Descargar playlist
// =====================================

async function loadPlaylist(url) {
  const cache = getCache(url);

  if (cache) {
    console.log("⚡ Playlist desde cache");

    return cache;
  }

  console.log("⬇ Descargando playlist...");

  const response = await axios.get(url, {
    timeout: 30000,
  });

  const categories = parseM3U(response.data);

  saveCache(url, categories);

  console.log(
    `✅ ${categories.length} categorías cargadas`
  );

  return categories;
}

// =====================================
// JSON
// =====================================

async function getPlaylistJson(deviceCode) {
  const result = await getPlaylist(deviceCode);

  if (result.expired) {
    return {
      success: false,
      expired: true,
      message: "Licencia caducada",
    };
  }

  if (!result.playlist) {
    return {
      success: true,
      playlist: null,
      categories: [],
    };
  }

  const categories = await loadPlaylist(
    result.playlist.url
  );

  return {
    success: true,
    playlist: {
      id: result.playlist.id,
      name: result.playlist.name,
      updated_at: result.playlist.updated_at,
    },
    categories,
  };
}

module.exports = {
  getPlaylist,
  getPlaylistJson,
  clearPlaylistCache,
  refreshPlaylist,
};