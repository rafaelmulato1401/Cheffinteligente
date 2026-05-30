export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      content: [{ type: "text", text: '{"receitas":[{"nome":"Erro de configuração","emoji":"⚠️","descricao":"Chave GEMINI_API_KEY não encontrada no servidor.","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}' }]
    });
  }

  try {
    const { system, messages, max_tokens } = req.body;
    const prompt = `${system || ""}\n\n${messages?.[0]?.content || ""}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(200).json({
        content: [{ type: "text", text: `{"receitas":[{"nome":"Erro Gemini","emoji":"⚠️","descricao":"${data.error.message}","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}` }]
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return res.status(200).json({
        content: [{ type: "text", text: '{"receitas":[{"nome":"Resposta vazia","emoji":"⚠️","descricao":"O Gemini retornou uma resposta vazia. Tente novamente.","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}' }]
      });
    }

    return res.status(200).json({ content: [{ type: "text", text }] });

  } catch (error) {
    return res.status(200).json({
      content: [{ type: "text", text: `{"receitas":[{"nome":"Erro interno","emoji":"⚠️","descricao":"${error.message}","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}` }]
    });
  }
}
