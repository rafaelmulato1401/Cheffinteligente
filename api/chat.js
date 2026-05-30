export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      content: [{ type: "text", text: '{"receitas":[{"nome":"Erro de configuração","emoji":"⚠️","descricao":"Chave GROQ_API_KEY não encontrada no servidor.","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}' }]
    });
  }

  try {
    const { system, messages, max_tokens } = req.body;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: max_tokens || 1200,
        temperature: 0.7,
        messages: [
          { role: "system", content: system || "" },
          { role: "user",   content: messages?.[0]?.content || "" },
        ],
      }),
    });

    const data = await groqRes.json();
    console.log("Groq status:", groqRes.status);
    console.log("Groq response:", JSON.stringify(data).slice(0, 300));

    if (data.error) {
      return res.status(200).json({
        content: [{ type: "text", text: `{"receitas":[{"nome":"Erro Groq","emoji":"⚠️","descricao":"${data.error.message}","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}` }]
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      return res.status(200).json({
        content: [{ type: "text", text: '{"receitas":[{"nome":"Resposta vazia","emoji":"⚠️","descricao":"O modelo retornou uma resposta vazia. Tente novamente.","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}' }]
      });
    }

    return res.status(200).json({ content: [{ type: "text", text }] });

  } catch (error) {
    console.error("CATCH ERROR:", error.message);
    return res.status(200).json({
      content: [{ type: "text", text: `{"receitas":[{"nome":"Erro interno","emoji":"⚠️","descricao":"${error.message}","tempo":"-","dificuldade":"-","porcoes":"-","ingredientesExtras":[]}]}` }]
    });
  }
}
