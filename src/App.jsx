import { useState, useRef, useEffect } from "react";

// ─── TEMAS ────────────────────────────────────────────────────────────────────
const DARK = {
  bg: "#0f0e0c",
  card: "#1a1814",
  cardAlt: "#201e18",
  border: "#2e2a22",
  accent: "#e8a838",
  accentText: "#111",
  text: "#f0ead8",
  textSub: "#c5b99a",
  muted: "#8a7f6a",
  tag: "#252118",
  tagText: "#e8a838",
  input: "#111",
  navBg: "#13120f",
  shadow: "0 4px 24px rgba(0,0,0,0.5)",
  success: "#6fcf97",
  warn: "#f2c94c",
  error: "#eb5757",
};
const LIGHT = {
  bg: "#f5f0e8",
  card: "#ffffff",
  cardAlt: "#faf7f2",
  border: "#e0d8ca",
  accent: "#c47f10",
  accentText: "#fff",
  text: "#1a1611",
  textSub: "#4a3f2f",
  muted: "#9a8f7a",
  tag: "#fef3db",
  tagText: "#b06d0a",
  input: "#faf7f2",
  navBg: "#fff",
  shadow: "0 4px 24px rgba(0,0,0,0.10)",
  success: "#27a85f",
  warn: "#c4930a",
  error: "#d63030",
};

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "tudo",    label: "Tudo",    emoji: "🍽️",  desc: "qualquer tipo de receita" },
  { id: "salgado", label: "Salgado", emoji: "🥩",  desc: "pratos salgados, refeições" },
  { id: "doce",    label: "Doce",    emoji: "🍰",  desc: "sobremesas e doces" },
  { id: "bebida",  label: "Bebidas", emoji: "🥤",  desc: "bebidas, sucos, drinks e smoothies" },
  { id: "lanche",  label: "Lanches", emoji: "🥪",  desc: "lanches, sanduíches e petiscos" },
  { id: "fitness", label: "Fitness", emoji: "💪",  desc: "receitas saudáveis e fitness" },
];

export default function ReceitasAI() {
  const [darkMode, setDarkMode]         = useState(true);
  const [ingredientes, setIngredientes] = useState([]);
  const [input, setInput]               = useState("");
  const [categoria, setCategoria]       = useState("tudo");
  const [receitas, setReceitas]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [aberta, setAberta]             = useState(null);
  const [detalhes, setDetalhes]         = useState({});
  const [loadingDetalhe, setLoadingDetalhe] = useState(null);
  const inputRef = useRef();
  const C = darkMode ? DARK : LIGHT;

  // viewport height fix para APK/mobile
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  function addIngrediente() {
    const val = input.trim();
    if (val && !ingredientes.includes(val.toLowerCase())) {
      setIngredientes((p) => [...p, val.toLowerCase()]);
    }
    setInput("");
    inputRef.current?.focus();
  }

  function removeIngrediente(item) {
    setIngredientes((p) => p.filter((i) => i !== item));
  }

  async function buscarReceitas() {
    if (ingredientes.length === 0) return;
    setLoading(true);
    setReceitas([]);
    setAberta(null);
    setDetalhes({});

    const cat = CATEGORIAS.find((c) => c.id === categoria);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `Você é um chef criativo especializado em ${cat.desc}.
Responda APENAS com JSON válido, sem markdown, sem texto extra.
Formato exato:
{
  "receitas": [
    {
      "nome": "Nome da Receita",
      "emoji": "🍽️",
      "tempo": "30 min",
      "dificuldade": "Fácil",
      "porcoes": "2 porções",
      "ingredientesExtras": ["item extra opcional"],
      "descricao": "Uma linha apetitosa descrevendo o prato."
    }
  ]
}
Gere 4 receitas da categoria "${cat.label}" (${cat.desc}).
Priorize receitas que usem os ingredientes fornecidos.
O campo "emoji" deve ser um emoji que represente bem cada receita.`,
          messages: [{ role: "user", content: `Ingredientes disponíveis: ${ingredientes.join(", ")}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setReceitas(parsed.receitas || []);
    } catch {
      setReceitas([{ nome: "Erro", emoji: "⚠️", descricao: "Não foi possível buscar receitas. Tente novamente.", tempo: "-", dificuldade: "-", porcoes: "-", ingredientesExtras: [] }]);
    }
    setLoading(false);
  }

  async function verReceita(index, receita) {
    if (aberta === index) { setAberta(null); return; }
    setAberta(index);
    if (detalhes[index]) return;
    setLoadingDetalhe(index);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: `Você é um chef detalhista. Responda APENAS com JSON válido, sem markdown.
Formato:
{
  "porcoes": "4 porções",
  "calorias": "350 kcal",
  "ingredientes": ["200g de carne picada", "1 lata de creme de leite"],
  "passos": ["Passo 1: ...", "Passo 2: ...", "Passo 3: ..."],
  "dica": "Uma dica especial do chef."
}`,
          messages: [{ role: "user", content: `Modo de preparo completo para: ${receita.nome}. Ingredientes disponíveis: ${ingredientes.join(", ")}.` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setDetalhes((p) => ({ ...p, [index]: parsed }));
    } catch {
      setDetalhes((p) => ({ ...p, [index]: { erro: true } }));
    }
    setLoadingDetalhe(null);
  }

  const diffColor = (d) =>
    d === "Fácil" ? C.success : d === "Médio" ? C.warn : C.error;

  const catAtual = CATEGORIAS.find((c) => c.id === categoria);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "calc(var(--vh, 1vh) * 100)",
      background: C.bg,
      color: C.text,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        padding: "env(safe-area-inset-top, 16px) 20px 16px",
        paddingTop: `max(env(safe-area-inset-top, 0px), 20px)`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: C.shadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.accent, fontFamily: "monospace" }}>
              ✦ CheffInteligente
            </p>
            <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: "normal", lineHeight: 1.2 }}>
              O que tem na <span style={{ color: C.accent }}>geladeira?</span>
            </h1>
          </div>

          {/* Toggle tema */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            style={{
              width: 44, height: 44,
              borderRadius: 22,
              border: `1.5px solid ${C.border}`,
              background: C.cardAlt,
              fontSize: 20,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
            title={darkMode ? "Modo claro" : "Modo escuro"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* ── SCROLL AREA ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>

        {/* ── SELEÇÃO DE CATEGORIA ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontFamily: "monospace" }}>
            Tipo de receita
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}>
            {CATEGORIAS.map((cat) => {
              const sel = categoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(cat.id)}
                  style={{
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: `1.5px solid ${sel ? C.accent : C.border}`,
                    background: sel ? `${C.accent}18` : C.card,
                    color: sel ? C.accent : C.muted,
                    fontSize: 12,
                    fontWeight: sel ? "bold" : "normal",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── INPUT INGREDIENTES ── */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "14px",
          marginBottom: 14,
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontFamily: "monospace" }}>
            Ingredientes disponíveis
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: ingredientes.length ? 12 : 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIngrediente()}
              placeholder="Ex: carne, alho, ovo..."
              style={{
                flex: 1,
                background: C.input,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "11px 14px",
                color: C.text,
                fontSize: 15,
                outline: "none",
                fontFamily: "inherit",
                WebkitAppearance: "none",
              }}
            />
            <button
              onClick={addIngrediente}
              style={{
                width: 46, height: 46,
                background: C.accent,
                border: "none",
                borderRadius: 10,
                color: C.accentText,
                fontSize: 24,
                fontWeight: "bold",
                cursor: "pointer",
                lineHeight: 1,
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >+</button>
          </div>

          {ingredientes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ingredientes.map((item) => (
                <span key={item} style={{
                  background: C.tag,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 13,
                  display: "flex", alignItems: "center", gap: 6,
                  color: C.tagText,
                }}>
                  {item}
                  <button
                    onClick={() => removeIngrediente(item)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.muted, fontSize: 16, padding: 0, lineHeight: 1,
                      display: "flex", alignItems: "center",
                    }}
                  >×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── BOTÃO BUSCAR ── */}
        <button
          onClick={buscarReceitas}
          disabled={loading || ingredientes.length === 0}
          style={{
            width: "100%",
            padding: "15px",
            background: (loading || ingredientes.length === 0) ? C.border : C.accent,
            border: "none",
            borderRadius: 12,
            color: (loading || ingredientes.length === 0) ? C.muted : C.accentText,
            fontSize: 15,
            fontWeight: "bold",
            letterSpacing: 1,
            cursor: (loading || ingredientes.length === 0) ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            textTransform: "uppercase",
            transition: "all 0.2s",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>{loading ? "⏳" : catAtual.emoji}</span>
          {loading ? "Buscando receitas..." : `Sugerir ${catAtual.label}`}
        </button>

        {/* ── LISTA DE RECEITAS ── */}
        {receitas.length > 0 && (
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontFamily: "monospace" }}>
              — {receitas.length} sugestões encontradas
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {receitas.map((r, i) => (
                <div key={i} style={{
                  background: C.card,
                  border: `1.5px solid ${aberta === i ? C.accent + "88" : C.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  boxShadow: aberta === i ? `0 0 0 3px ${C.accent}18` : "none",
                }}>
                  {/* Card topo */}
                  <div
                    onClick={() => verReceita(i, r)}
                    style={{ padding: "14px 14px 14px", cursor: "pointer", userSelect: "none" }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* Emoji big */}
                      <div style={{
                        width: 52, height: 52, flexShrink: 0,
                        background: C.cardAlt,
                        borderRadius: 12,
                        border: `1px solid ${C.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28,
                      }}>
                        {r.emoji || "🍽️"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: "normal", color: C.text, lineHeight: 1.3 }}>{r.nome}</h3>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{r.descricao}</p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>⏱ {r.tempo}</span>
                          <span style={{ fontSize: 11, color: diffColor(r.dificuldade), fontFamily: "monospace" }}>◈ {r.dificuldade}</span>
                          {r.porcoes && <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>👥 {r.porcoes}</span>}
                        </div>
                      </div>

                      <div style={{
                        color: aberta === i ? C.accent : C.muted,
                        fontSize: 22,
                        lineHeight: 1,
                        transform: aberta === i ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.25s, color 0.2s",
                        marginTop: 2,
                      }}>›</div>
                    </div>
                  </div>

                  {/* Detalhes */}
                  {aberta === i && (
                    <div style={{
                      borderTop: `1px solid ${C.border}`,
                      padding: "14px",
                      background: C.cardAlt,
                      animation: "fadeIn 0.2s ease",
                    }}>
                      {loadingDetalhe === i ? (
                        <div style={{ textAlign: "center", padding: "16px 0" }}>
                          <p style={{ color: C.muted, fontSize: 13, fontFamily: "monospace", margin: 0 }}>
                            🍳 Preparando receita completa...
                          </p>
                        </div>
                      ) : detalhes[i]?.erro ? (
                        <p style={{ color: C.error, fontSize: 13, margin: 0 }}>Erro ao carregar. Tente novamente.</p>
                      ) : detalhes[i] ? (
                        <div>
                          {/* Badges calorias/porções */}
                          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                            {detalhes[i].porcoes && (
                              <span style={{ background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.accent, fontFamily: "monospace" }}>
                                👥 {detalhes[i].porcoes}
                              </span>
                            )}
                            {detalhes[i].calorias && (
                              <span style={{ background: `${C.accent}18`, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.accent, fontFamily: "monospace" }}>
                                🔥 {detalhes[i].calorias}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontFamily: "monospace", margin: "0 0 8px" }}>Ingredientes</p>
                          <ul style={{ margin: "0 0 16px", padding: "0 0 0 18px" }}>
                            {detalhes[i].ingredientes?.map((item, j) => (
                              <li key={j} style={{ color: C.textSub, fontSize: 13, marginBottom: 5, lineHeight: 1.5 }}>{item}</li>
                            ))}
                          </ul>

                          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontFamily: "monospace", margin: "0 0 8px" }}>Modo de Preparo</p>
                          <ol style={{ margin: "0 0 16px", padding: "0 0 0 20px" }}>
                            {detalhes[i].passos?.map((passo, j) => (
                              <li key={j} style={{ color: C.textSub, fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>{passo}</li>
                            ))}
                          </ol>

                          {detalhes[i].dica && (
                            <div style={{
                              background: `${C.accent}12`,
                              border: `1px solid ${C.accent}33`,
                              borderRadius: 10,
                              padding: "10px 14px",
                            }}>
                              <p style={{ margin: 0, fontSize: 13, color: C.accent, lineHeight: 1.6 }}>
                                <strong>💡 Dica do chef:</strong> {detalhes[i].dica}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && receitas.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{catAtual.emoji}</div>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              {ingredientes.length === 0
                ? "Adicione ingredientes acima\ne descubra o que preparar hoje."
                : "Pronto! Clique em Sugerir para ver as receitas."}
            </p>
          </div>
        )}
      </div>

      {/* ── WATERMARK FIXO ── */}
      <div style={{
        position: "fixed",
        bottom: "max(env(safe-area-inset-bottom, 0px), 6px)",
        right: 10,
        zIndex: 9999,
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}>
        <span style={{
          fontSize: 9,
          color: C.muted,
          opacity: 0.45,
          fontFamily: "monospace",
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
        }}>
          Desenvolvido por Rafael Mulato
        </span>
      </div>

      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; overscroll-behavior: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input::placeholder { color: ${C.muted}; }
      `}</style>
    </div>
  );
}
