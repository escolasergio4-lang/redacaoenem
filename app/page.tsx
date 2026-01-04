"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
  BookOpen, Sparkles, GraduationCap, Key, AlertCircle, Loader2, Send, 
  PenTool, Library, Radar, CheckCircle2, XCircle, Trophy, BookA, Search, FileText, ArrowRight, Star, LogOut, Check 
} from "lucide-react"
import { toast } from "sonner"

export default function EnemProPage() {
  // --- ESTADO DA CAPA (LANDING PAGE) ---
  const [showLanding, setShowLanding] = useState(true)

  // --- ESTADOS GERAIS DO APP ---
  const [currentView, setCurrentView] = useState("editor") 
  const [geminiKey, setGeminiKey] = useState("")
  const [groqKey, setGroqKey] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // --- ESTADOS DO EDITOR ---
  const [texto, setTexto] = useState("")
  const [loadingCorrecao, setLoadingCorrecao] = useState(false)
  const [correcao, setCorrecao] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("feedback")

  // --- ESTADOS DO DICIONÁRIO ---
  const [dicioInput, setDicioInput] = useState("")
  const [dicioResult, setDicioResult] = useState<string | null>(null)
  const [loadingDicio, setLoadingDicio] = useState(false)

  // --- ESTADOS DO CHAT ---
  const [chatInput, setChatInput] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([
    { role: 'assistant', content: 'Olá! Sou seu tutor virtual. Vamos discutir a estrutura do seu texto ou analisar uma tese?' }
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  // --- ESTADOS DE TEMAS E SIMULADO ---
  const [temasPrevistos, setTemasPrevistos] = useState<string>("")
  const [simulado, setSimulado] = useState<string>("")
  const [loadingTemas, setLoadingTemas] = useState(false)
  const [loadingSimulado, setLoadingSimulado] = useState(false)

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    const savedGemini = localStorage.getItem("gemini_key")
    const savedGroq = localStorage.getItem("groq_key")
    if (savedGemini) setGeminiKey(savedGemini)
    if (savedGroq) setGroqKey(savedGroq)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chatMessages])

  const handleSaveKeys = () => {
    localStorage.setItem("gemini_key", geminiKey)
    localStorage.setItem("groq_key", groqKey)
    setIsModalOpen(false)
    toast.success("Chaves salvas!")
  }

  // --- FUNÇÕES DA IA (Lógica Intacta) ---
  const corrigirRedacao = async () => {
    if (!geminiKey) { setIsModalOpen(true); return; }
    if (texto.length < 50) { toast.warning("Texto muito curto."); return; }
    setLoadingCorrecao(true); setActiveTab("feedback")
    const prompt = `Atue como Corretor Oficial do ENEM. Analise o texto: "${texto}". Retorne feedback Markdown: Nota [0-1000], Detalhe Competências, Pontos Fortes, Erros, Dica de Ouro.`
    try {
      let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) })
      if (!response.ok) response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) })
      if (!response.ok) throw new Error("Falha IA"); const data = await response.json(); setCorrecao(data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta."); toast.success("Correção realizada!")
    } catch (e:any) { toast.error("Erro: " + e.message) } finally { setLoadingCorrecao(false) }
  }

  const consultarDicionario = async () => {
    if (!dicioInput.trim() || !geminiKey) { if(!geminiKey) setIsModalOpen(true); return; }
    setLoadingDicio(true)
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `Dicionário ENEM para: "${dicioInput}". Definição, 3 sinônimos cultos, 1 exemplo.` }] }] }) })
      const d = await r.json(); setDicioResult(d.candidates?.[0]?.content?.parts?.[0]?.text || "Erro.");
    } catch (e) { toast.error("Erro Dicionário") } finally { setLoadingDicio(false) }
  }

  const enviarMensagemChat = async () => {
    if (!chatInput.trim() || !groqKey) { if(!groqKey && chatInput.trim()) {setIsModalOpen(true); return;} return; }
    const userMsg = chatInput; setChatInput(""); setChatMessages(p => [...p, { role: 'user', content: userMsg }]); setLoadingChat(true)
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "system", content: "Professor ENEM didático." }, ...chatMessages.map(m=>({role:m.role, content:m.content})), { role: "user", content: userMsg }], model: "llama-3.3-70b-versatile", temperature: 0.6 }) })
      const d = await r.json(); setChatMessages(p => [...p, { role: 'assistant', content: d.choices[0]?.message?.content || "Erro." }])
    } catch (e) { toast.error("Erro Chat") } finally { setLoadingChat(false) }
  }

  const gerarPrevisaoTemas = async () => {
    if (!geminiKey) { setIsModalOpen(true); return; }
    setLoadingTemas(true); setSimulado("")
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Liste 3 temas quentes ENEM este ano com justificativa." }] }] }) })
      const d = await r.json(); setTemasPrevistos(d.candidates?.[0]?.content?.parts?.[0]?.text || "Erro.")
    } catch (e) { toast.error("Erro Temas") } finally { setLoadingTemas(false) }
  }

  const gerarSimulado = async () => {
    if (!geminiKey) { setIsModalOpen(true); return; }
    setLoadingSimulado(true); setTemasPrevistos("")
    const prompt = `Crie Proposta Redação ENEM COMPLETA (Markdown): Tema Inédito + 3 Textos Motivadores (Dados, Leis, Notícia) + Instruções.`
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) })
      const d = await r.json(); setSimulado(d.candidates?.[0]?.content?.parts?.[0]?.text || "Erro.")
    } catch (e) { toast.error("Erro Simulado") } finally { setLoadingSimulado(false) }
  }

  // --- RENDERIZAÇÃO: LANDING PAGE ---
  if (showLanding) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
        {/* HEADER */}
        <header className="px-6 h-20 bg-white/90 backdrop-blur-md border-b flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold text-2xl text-slate-800">
            <GraduationCap className="text-indigo-600 w-8 h-8" /> EnemPro
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Recursos</a>
            <a href="#metodo" className="hover:text-indigo-600 transition">O Método</a>
          </nav>
          <Button onClick={() => { setCurrentView('editor'); setShowLanding(false); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-lg">
            Acessar Plataforma
          </Button>
        </header>

        {/* HERO */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-indigo-50">
          <Badge className="mb-6 bg-indigo-100 text-indigo-700 px-3 py-1 hover:bg-indigo-200">✨ Versão 2.5: Agora com IA Preditiva</Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl">
            Sua Redação <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Nota 1000</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
            Plataforma inteligente que une correção em tempo real, previsão de temas e tutoria personalizada para garantir sua aprovação.
          </p>
          <div className="flex gap-4 flex-col md:flex-row">
            <Button onClick={() => { setCurrentView('editor'); setShowLanding(false); }} size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl rounded-full gap-2 hover:-translate-y-1 transition-all">
              Começar Agora <ArrowRight className="w-5 h-5" />
            </Button>
            {/* BOTÃO CORRIGIDO: Agora leva para a aba de Estudos */}
            <Button onClick={() => { setCurrentView('estudos'); setShowLanding(false); }} size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-300 text-slate-600 hover:bg-white hover:text-indigo-600 gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Ver Exemplos
            </Button>
          </div>
        </section>

        {/* RECURSOS (Grid Corrigido: grid-cols-1 no mobile) */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Tudo o que você precisa</h2>
            <p className="text-slate-500 mt-2">Tecnologia de ponta a favor do seu texto.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><Sparkles className="w-6 h-6 text-blue-600" /></div>
                <CardTitle>Correção Instantânea</CardTitle>
                <CardDescription>IA treinada nas 5 competências do ENEM para dar feedback imediato.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4"><Radar className="w-6 h-6 text-purple-600" /></div>
                <CardTitle>Radar de Temas</CardTitle>
                <CardDescription>Gere simulados completos e previsões de temas baseados em dados.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-none shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4"><BookA className="w-6 h-6 text-emerald-600" /></div>
                <CardTitle>Vocabulário Rico</CardTitle>
                <CardDescription>Dicionário integrado que sugere sinônimos cultos enquanto você escreve.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* NOVA SEÇÃO: MÉTODO (Link Corrigido) */}
        <section id="metodo" className="py-20 bg-slate-100">
          <div className="px-6 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">O Método EnemPro</h2>
              <p className="text-slate-500 mt-2">Simples, direto e eficaz.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                <div><h3 className="font-bold text-lg">Escreva ou Cole</h3><p className="text-slate-600">Use nosso editor limpo ou cole sua redação feita em outro lugar.</p></div>
              </div>
              <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                <div><h3 className="font-bold text-lg">Receba Análise da IA</h3><p className="text-slate-600">Em segundos, receba nota estimada e pontos de melhoria específicos.</p></div>
              </div>
              <div className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                <div><h3 className="font-bold text-lg">Reescreva e Aprenda</h3><p className="text-slate-600">Use o chat tutor para tirar dúvidas e melhorar sua técnica a cada texto.</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-8 text-center text-slate-400 text-sm bg-white border-t">
          <p>© 2024 EnemPro. Desenvolvido com ❤️ e IA.</p>
        </footer>
      </div>
    )
  }

  // --- APLICATIVO PRINCIPAL ---
  return (
    <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ativar Inteligência Artificial</DialogTitle><DialogDescription>Insira suas chaves para desbloquear o Corretor e o Tutor.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Gemini API Key</Label><Input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} /></div>
            <div><Label>Groq API Key</Label><Input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveKeys}>Conectar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIDEBAR */}
      <aside className="w-20 md:w-64 bg-slate-900 text-white flex flex-col py-6 shadow-2xl shrink-0 z-20">
        <div className="px-4 mb-8 hidden md:block items-center md:items-start flex flex-col">
          <div className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-indigo-400" /> EnemPro</div>
          <div className="text-xs text-slate-500 mt-1">Área do Aluno</div>
        </div>
        
        <div className="px-2 md:px-0 w-full flex-1 space-y-2 flex flex-col items-center md:items-stretch">
          <Button variant={currentView === 'editor' ? "secondary" : "ghost"} className="w-full justify-start gap-3 rounded-none md:px-6" onClick={() => setCurrentView('editor')}>
            <PenTool className="w-5 h-5" /> <span className="hidden md:inline">Editor & Correção</span>
          </Button>
          <Button variant={currentView === 'estudos' ? "secondary" : "ghost"} className="w-full justify-start gap-3 rounded-none md:px-6" onClick={() => setCurrentView('estudos')}>
            <Library className="w-5 h-5" /> <span className="hidden md:inline">Material de Estudo</span>
          </Button>
          <Button variant={currentView === 'temas' ? "secondary" : "ghost"} className="w-full justify-start gap-3 rounded-none md:px-6" onClick={() => setCurrentView('temas')}>
            <Radar className="w-5 h-5" /> <span className="hidden md:inline">Radar de Temas</span>
          </Button>
        </div>

        <div className="px-4 w-full space-y-2 mt-auto">
          <Button variant="outline" size="sm" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200" onClick={() => setIsModalOpen(true)}>
            <Key className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Configurar</span>
          </Button>
          {/* BOTÃO DE SAIR ADICIONADO AQUI */}
          <Button variant="destructive" size="sm" className="w-full bg-red-900/50 border-red-900 hover:bg-red-700 text-red-100" onClick={() => setShowLanding(true)}>
            <LogOut className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Sair do App</span>
          </Button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 relative">
        
        {currentView === 'editor' && (
          <div className="flex-1 flex h-full">
            <section className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
              <header className="mb-4"><h2 className="text-2xl font-bold text-slate-800">Laboratório de Redação</h2><p className="text-slate-500">Escreva seu texto abaixo e receba feedback imediato.</p></header>
              <Card className="flex-1 shadow-sm border-slate-200 flex flex-col p-6 bg-white">
                <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Comece sua redação aqui... Use o dicionário ao lado para enriquecer seu texto." className="flex-1 text-lg font-serif leading-relaxed border-none resize-none focus-visible:ring-0 p-0" />
              </Card>
              <div className="mt-4 flex justify-between items-center"><span className="text-xs text-slate-400">{texto.length} caracteres</span><Button onClick={corrigirRedacao} disabled={loadingCorrecao} className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-8">{loadingCorrecao ? <Loader2 className="animate-spin" /> : <Sparkles className="w-4 h-4" />} Analisar Texto</Button></div>
            </section>
            <aside className="w-96 border-l bg-white flex flex-col shadow-lg overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b h-14 p-0 bg-slate-50 shrink-0">
                  <TabsTrigger value="feedback" className="flex-1 h-full data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:bg-white">Correção</TabsTrigger>
                  <TabsTrigger value="dicio" className="flex-1 h-full data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:bg-white">Dicionário</TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1 h-full data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:bg-white">Tutor</TabsTrigger>
                </TabsList>
                <TabsContent value="feedback" className="flex-1 relative overflow-hidden data-[state=inactive]:hidden"><div className="absolute inset-0 overflow-y-auto p-6 pb-24 bg-slate-50/30">{!correcao ? (<div className="text-center text-slate-400 mt-20 flex flex-col items-center"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 opacity-20" /></div><p>Sua correção aparecerá aqui.</p></div>) : (<div className="prose prose-sm prose-slate max-w-none bg-white p-6 rounded-lg border shadow-sm"><div className="whitespace-pre-wrap">{correcao}</div></div>)}</div></TabsContent>
                <TabsContent value="dicio" className="flex-1 flex flex-col overflow-hidden bg-slate-50 data-[state=inactive]:hidden"><div className="p-4 border-b bg-white"><Label className="mb-2 block text-xs font-bold text-slate-500 uppercase">Consultar Vocabulário</Label><div className="flex gap-2"><Input value={dicioInput} onChange={e => setDicioInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && consultarDicionario()} placeholder="Digite uma palavra..." /><Button size="icon" onClick={consultarDicionario} disabled={loadingDicio} className="bg-emerald-600 hover:bg-emerald-700">{loadingDicio ? <Loader2 className="animate-spin w-4 h-4"/> : <Search className="w-4 h-4"/>}</Button></div></div><div className="flex-1 overflow-y-auto p-6">{!dicioResult ? (<div className="text-center text-slate-400 mt-10"><BookA className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm">Busque definições.</p></div>) : (<Card className="border-emerald-100 bg-emerald-50/30"><CardHeader className="pb-2"><CardTitle className="text-emerald-800 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Resultado</CardTitle></CardHeader><CardContent className="prose prose-sm prose-slate pt-0"><div className="whitespace-pre-wrap">{dicioResult}</div></CardContent></Card>)}</div></TabsContent>
                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden bg-white data-[state=inactive]:hidden"><div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>{chatMessages.map((m, i) => (<div key={i} className={`text-sm p-3 rounded-lg max-w-[90%] ${m.role === 'user' ? 'bg-indigo-600 text-white ml-auto' : 'bg-slate-100 text-slate-700 border'}`}>{m.content}</div>))}</div><div className="p-3 border-t flex gap-2 shrink-0 bg-slate-50"><Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarMensagemChat()} placeholder="Tire suas dúvidas..." className="bg-white" /><Button size="icon" onClick={enviarMensagemChat} disabled={loadingChat} className="bg-indigo-600"><Send className="w-4 h-4" /></Button></div></TabsContent>
              </Tabs>
            </aside>
          </div>
        )}

        {currentView === 'estudos' && (
          <ScrollArea className="flex-1 h-full p-8">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="mb-6"><h2 className="text-3xl font-bold text-slate-900 mb-2">Central de Conhecimento</h2><p className="text-slate-600">Recursos para nota 1000.</p></div>
              <Card className="bg-white border-indigo-100 shadow-lg overflow-hidden"><CardHeader className="bg-indigo-600 text-white p-6"><div className="flex items-center gap-3 mb-2"><Trophy className="w-8 h-8 text-yellow-300" /><h3 className="text-2xl font-bold">Exemplo Nota 1000</h3></div><CardDescription className="text-indigo-100">Tema: <strong>Cinema (2019)</strong></CardDescription></CardHeader><CardContent className="p-0"><div className="border-b p-6 hover:bg-slate-50 transition"><Badge className="bg-indigo-100 text-indigo-700 mb-3 text-sm">Introdução</Badge><p className="font-serif text-lg leading-relaxed text-slate-800 mb-4">"No filme 'Cine Hollywood'... o protagonista luta para manter vivo o cinema... Nesse contexto, é fundamental analisar como a <strong>negligência estatal</strong> e a <strong>lógica mercadológica</strong> perpetuam a concentração cultural."</p></div><div className="p-6 bg-indigo-50/30"><Badge className="bg-purple-100 text-purple-700 mb-3 text-sm">Conclusão</Badge><p className="font-serif text-lg leading-relaxed text-slate-800 mb-4">"Portanto... cabe ao <strong>Ministério da Cultura</strong> criar o projeto 'Cinema na Praça'..."</p></div></CardContent></Card>
              <div className="grid md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="text-lg">Competências</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between border-b pb-2"><span>I. Norma Culta</span> <Badge variant="secondary">200 pts</Badge></div><div className="flex justify-between border-b pb-2"><span>V. Intervenção</span> <Badge variant="secondary">200 pts</Badge></div></CardContent></Card><Card className="border-red-100 bg-red-50/30"><CardHeader><CardTitle className="text-lg text-red-700">Zeros</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-700"><p>🚫 Fuga ao tema.</p><p>🚫 Desrespeito aos DH.</p></CardContent></Card></div>
            </div>
          </ScrollArea>
        )}

        {currentView === 'temas' && (
          <ScrollArea className="flex-1 h-full p-8">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="mb-6"><h2 className="text-3xl font-bold text-slate-900 mb-2">Radar de Temas & Simulados</h2><p className="text-slate-600">Use a IA para prever tendências ou gerar provas completas.</p></div>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-purple-200 bg-purple-50 hover:bg-purple-100 transition cursor-pointer" onClick={gerarPrevisaoTemas}><CardHeader><CardTitle className="flex items-center gap-2 text-purple-800">{loadingTemas ? <Loader2 className="animate-spin" /> : <Sparkles />} Previsão de Temas</CardTitle><CardDescription>A IA analisa o contexto atual e sugere 3 apostas.</CardDescription></CardHeader></Card>
                <Card className="border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer" onClick={gerarSimulado}><CardHeader><CardTitle className="flex items-center gap-2 text-indigo-800">{loadingSimulado ? <Loader2 className="animate-spin" /> : <FileText />} Gerar Proposta Completa</CardTitle><CardDescription>Cria uma prova estilo ENEM com Textos Motivadores.</CardDescription></CardHeader></Card>
              </div>
              {temasPrevistos && <Card className="border-purple-200 bg-white mb-8 shadow-md"><CardHeader><CardTitle className="text-purple-800">🔮 Previsão Gemini</CardTitle></CardHeader><CardContent className="prose prose-slate max-w-none"><div className="whitespace-pre-wrap">{temasPrevistos}</div></CardContent></Card>}
              {simulado && <Card className="border-2 border-slate-300 bg-[#fffdf5] mb-8 shadow-xl"><CardHeader className="border-b border-slate-200 pb-4"><div className="flex justify-between items-center"><div className="flex items-center gap-2 font-bold text-slate-800 text-lg uppercase tracking-wide"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Brasao_oficial_brasil_1922.svg/1200px-Brasao_oficial_brasil_1922.svg.png" className="w-8 h-8 opacity-80" alt="Brasão" />Proposta de Redação</div><Badge variant="outline" className="border-slate-800 text-slate-800 rounded-sm">ENEM SIMULADO</Badge></div></CardHeader><CardContent className="prose prose-slate max-w-none p-8 font-serif"><div className="whitespace-pre-wrap">{simulado}</div></CardContent></Card>}
              <div className="grid gap-4 mt-8 opacity-70"><h3 className="font-bold text-xl text-slate-800">Histórico Oficial</h3>{[ {ano: "2024", tema: "Herança Africana"}, {ano: "2023", tema: "Trabalho de Cuidado da Mulher"} ].map((t) => (<div key={t.ano} className="flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm"><Badge variant="outline">{t.ano}</Badge><span className="font-medium">{t.tema}</span></div>))}</div>
            </div>
          </ScrollArea>
        )}

      </main>
    </div>
  )
}