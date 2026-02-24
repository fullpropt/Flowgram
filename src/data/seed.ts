import { v4 as uuidv4 } from "uuid";
import { IdeaCard, IdeaCardInput } from "@/types/models";

const seedTemplates: IdeaCardInput[] = [
  {
    titulo: "Por que seu direct vira atendimento infinito",
    descricao:
      "Mostrar o custo operacional de responder tudo manualmente no Instagram.",
    pilar: "Dor",
    camadas: {
      macroTema: "Gargalo no atendimento",
      formato: "Carrossel",
      objetivo: "Engajamento",
      hook: "Seu direct virou um segundo emprego?",
      cta: "Comente QUERO para ver como automatizar.",
    },
    status: "Ideia",
    tags: ["instagram", "automacao", "atendimento"],
  },
  {
    titulo: "3 sinais de que voce esta perdendo vendas no direct",
    descricao: "Checklist simples para identificar vazamentos no funil.",
    pilar: "Dor",
    camadas: {
      macroTema: "Perda de vendas",
      formato: "Reels",
      objetivo: "Autoridade",
      hook: "Voce acha que nao vende por falta de lead?",
      cta: "Salve para revisar seu processo.",
    },
    status: "Roteirizado",
    tags: ["vendas", "funil", "direct"],
  },
  {
    titulo: "Como funciona um funil de DM em 4 passos",
    descricao: "Explicar fluxo de captura, qualificacao, oferta e fechamento.",
    pilar: "Educacao",
    camadas: {
      macroTema: "Funil de mensagens",
      formato: "Carrossel",
      objetivo: "Autoridade",
      hook: "Funil no direct nao e improviso.",
      cta: "Envie para quem trabalha com social media.",
    },
    status: "Ideia",
    tags: ["funil", "educacao", "dm"],
  },
  {
    titulo: "Diferenca entre resposta rapida e automacao inteligente",
    descricao: "Comparar respostas prontas com fluxos orientados por objetivo.",
    pilar: "Educacao",
    camadas: {
      macroTema: "Automacao pratica",
      formato: "Print",
      objetivo: "Engajamento",
      hook: "Atalho nao e estrategia.",
      cta: "Compartilhe com sua equipe.",
    },
    status: "Roteirizado",
    tags: ["automacao", "instagram", "crm"],
  },
  {
    titulo: "Como o ZapVender qualifica leads automaticamente",
    descricao: "Mostrar o fluxo de perguntas e segmentacao dentro do WhatsApp.",
    pilar: "Solucao",
    camadas: {
      macroTema: "Qualificacao automatica",
      formato: "Reels",
      objetivo: "Conversao",
      hook: "Lead frio tambem compra quando e bem conduzido.",
      cta: "Clique no link da bio para teste.",
    },
    status: "Ideia",
    tags: ["zapvender", "lead", "whatsapp"],
  },
  {
    titulo: "Caso real: +37% de fechamento em 30 dias",
    descricao:
      "Storytelling rapido de cliente que automatizou o atendimento e aumentou a conversao.",
    pilar: "Solucao",
    camadas: {
      macroTema: "Resultados",
      formato: "Carrossel",
      objetivo: "Conversao",
      hook: "Nao foi sorte. Foi processo.",
      cta: "Quer aplicar no seu negocio? Fale com a gente.",
    },
    status: "Criado",
    tags: ["case", "resultado", "vendas"],
  },
  {
    titulo: "Bastidores: como desenhamos um novo fluxo",
    descricao: "Mostrar quadro de planejamento e criterios da equipe de produto.",
    pilar: "Construcao",
    camadas: {
      macroTema: "Produto",
      formato: "Story",
      objetivo: "Hype",
      hook: "Spoiler do que vem na proxima atualizacao.",
      cta: "Responda este story com sua duvida.",
    },
    status: "Ideia",
    tags: ["bastidores", "produto", "story"],
  },
  {
    titulo: "Roadmap aberto: prioridades do proximo trimestre",
    descricao:
      "Transparencia de roadmap com foco em recursos pedidos por clientes.",
    pilar: "Construcao",
    camadas: {
      macroTema: "Roadmap",
      formato: "Imagem unica",
      objetivo: "Lista de espera",
      hook: "Voce pediu, a gente colocou no roadmap.",
      cta: "Entre na lista de espera para acesso antecipado.",
    },
    status: "Roteirizado",
    tags: ["roadmap", "comunidade", "lancamento"],
  },
  {
    titulo: "Template de mensagem para recuperar leads sem resposta",
    descricao: "Entregar um mini template pratico que gera retorno.",
    pilar: "Educacao",
    camadas: {
      macroTema: "Recuperacao de lead",
      formato: "Carrossel",
      objetivo: "Engajamento",
      hook: "Parou no meio da conversa? Use esta estrutura.",
      cta: "Comente TEMPLATE para receber mais modelos.",
    },
    status: "Ideia",
    tags: ["template", "lead", "engajamento"],
  },
  {
    titulo: "Comparativo: manual x ZapVender em uma semana",
    descricao: "Mostrar horas economizadas e ganhos de performance.",
    pilar: "Solucao",
    camadas: {
      macroTema: "Produtividade",
      formato: "Print",
      objetivo: "Autoridade",
      hook: "Quanto custa insistir no manual?",
      cta: "Marque quem precisa ver isso.",
    },
    status: "Ideia",
    tags: ["produtividade", "zapvender", "benchmark"],
  },
];

export function buildInitialIdeaCards(): IdeaCard[] {
  const now = new Date().toISOString();
  return seedTemplates.map((template) => ({
    id: uuidv4(),
    titulo: template.titulo ?? "",
    descricao: template.descricao,
    pilar: template.pilar,
    camadas: template.camadas ?? {},
    status: template.status ?? "Ideia",
    tags: template.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }));
}
