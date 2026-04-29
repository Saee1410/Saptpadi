const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Budget = require("../models/Budget");

// API Key चेक करा
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/plan-budget", async (req, res) => {
    try {
        const { totalBudget, guestCount, locationType } = req.body;

        // 'gemini-1.5-flash' हे मॉडेल सर्वात स्टेबल आणि फास्ट आहे
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `As a Wedding Planner, analyze this: Budget ₹${totalBudget}, Guests ${guestCount}, Type ${locationType}. 
        Return ONLY a JSON object with this EXACT structure (no markdown tags):
        {
          "categories": [
            {"category": "Venue & Food", "amount": 0, "tip": "Give a specific tip for this budget"},
            {"category": "Decoration", "amount": 0, "tip": "Give a specific tip"},
            {"category": "Photography", "amount": 0, "tip": "Give a specific tip"},
            {"category": "Clothing", "amount": 0, "tip": "Give a specific tip"},
            {"category": "Others", "amount": 0, "tip": "Give a specific tip"}
          ],
          "summary": "Short realism check message"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // JSON शोधण्यासाठी Regex (खूप महत्त्वाचे - जेणेकरून ५०० एरर येणार नाही)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI ने योग्य JSON फॉरमॅट दिला नाही.");

        const planData = JSON.parse(jsonMatch[0]);

        // MongoDB मध्ये डेटा सेव्ह करणे
        const savedPlan = await Budget.create({
            totalBudget: Number(totalBudget),
            guestCount: Number(guestCount),
            locationType: locationType,
            plan: planData
        });

        res.json({ 
            success: true, 
            plan: planData, 
            historyId: savedPlan._id 
        });

    } catch (error) {
        console.error("❌ API ERROR:", error);
        res.status(500).json({ 
            success: false, 
            message: "Planning failed: " + error.message 
        });
    }
});

// History मिळवण्यासाठी
router.get("/get-history", async (req, res) => {
    try {
        const history = await Budget.find().sort({ createdAt: -1 });
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete करण्यासाठी
router.delete("/delete-history/:id", async (req, res) => {
    try {
        await Budget.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;