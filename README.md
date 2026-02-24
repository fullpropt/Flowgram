# Flowgram Lab

Planejador visual de conteudo para Instagram com login e multiusuario.

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Zustand (estado global)
- PostgreSQL + Prisma (persistencia)
- NextAuth (login com email/senha)
- @dnd-kit/core + @dnd-kit/sortable (board de organizacao)
- react-big-calendar (mes/semana + drag externo)

## Rotas

- `/login` - Login / cadastro
- `/ideas` - Banco de Ideias (CRUD + filtros)
- `/organize` - Board por pilares + gerar semana
- `/calendar` - Calendario mensal/semanal + agendamentos

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Como rodar local

```bash
npm install
npm run db:push
npm run dev
```

Abra `http://localhost:3000` (redireciona para `/ideas` se autenticado, senao `/login`).

## Deploy no Railway

Build command sugerido:

```bash
npm ci && npm run db:push && npm run build
```

Start command:

```bash
npm run start
```

## Scripts

```bash
npm run db:push
npm run db:generate
npm run lint
npm run build
```
