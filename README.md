# Flowgram

Esqueleto inicial de um planejador visual de conteudo para Instagram.

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Zustand (estado global)
- LocalStorage (persistencia MVP)
- @dnd-kit/core + @dnd-kit/sortable (board de organizacao)
- react-big-calendar (mes/semana + drag externo)

## Rotas

- `/ideas` - Banco de Ideias (CRUD + filtros)
- `/organize` - Board por pilares + gerar semana
- `/calendar` - Calendario mensal/semanal + agendamentos

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` (redireciona para `/ideas`).

## Scripts

```bash
npm run lint
npm run build
```
