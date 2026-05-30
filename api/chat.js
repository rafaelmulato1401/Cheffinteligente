export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { system, messages, max_tokens } = req.body;

    // Montar prompt unificado para o Gemini
    const systemText = system ? `${system}\n\n` : "";
    const userText = messages?.[0]?.content || "";
    const prompt = systemText + userText;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: max_tokens || 1200,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();

    // Converter resposta do Gemini para o formato que o App espera (igual Anthropic)
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao conectar com o Gemini" });
  }
}
