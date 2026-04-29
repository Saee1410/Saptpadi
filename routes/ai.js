const express = require("express");
const router = express.Router();

router.post("/generate-style", async (req, res) => {
    try {
        let { prompt } = req.body;

        // 1. Clean the prompt
        let cleanUserPrompt = prompt
            ? prompt.replace(/&/g, "and")
                    .replace(/[:]/g, "")
                    .replace(/Wedding mandap decoration with/gi, "")
                    .trim()
            : "royal red and gold";

        // 2. Strict Keywords
        const coreKeywords = "Indoor luxury wedding stage, grand decorative gazebo, banquet hall interior";
        const decoration = "marigold flower curtains, rose flower walls, golden stage pillars, royal sofa seating";
        const photography = "architectural photography, symmetrical wide shot, warm spotlighting, 8k resolution, photorealistic";
        const noOutdoor = "no sky, no mountains, no forest, no trees, no grass, no river, no people";

        // 3. Final Combined Prompt
        const finalPrompt = `${coreKeywords}, ${cleanUserPrompt}, ${decoration}, ${photography}, ${noOutdoor}`
            .replace(/\s+/g, ' ') 
            .trim();

        const seed = Math.floor(Math.random() * 1000000);
        
        // Final URL Construction
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

        console.log("✅ Backend Mandap Ready:", imageUrl);

        res.json({
            success: true,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
