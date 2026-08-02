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

module.exports = router;