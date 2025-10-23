# worker/Dockerfile

# --- ESTÁGIO 1: "Builder" ---
# Usamos a imagem oficial do Node 18 baseada em Alpine.
# Nomeamos este estágio como "builder"
FROM node:18.19.1-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de definição de dependências
COPY package*.json ./

# Instala dependências de produção de forma "limpa" (ci = clean install)
# Isso é mais seguro e rápido que 'npm install' e ignora 'devDependencies'
RUN npm ci

# Copia o restante do seu código-fonte (index.js, etc.)
COPY . .

# --- ESTÁGIO 2: "Production" ---
# Começamos de uma imagem Alpine "limpa" e estável (tag específica)
FROM alpine:3.18

# Instala apenas o Node.js (runtime), 'tzdata' e 'dumb-init'
# - 'nodejs' é o runtime mínimo.
# - 'tzdata' é CRUCIAL para o 'node-cron' funcionar com timezones (ex: "America/Sao_Paulo").
# - 'dumb-init' é a melhor prática para ser o PID 1, gerenciando sinais (Ctrl+C)
#   e "limpando" processos filhos corretamente.
RUN apk add --no-cache nodejs npm tzdata dumb-init

# Define o diretório de trabalho
WORKDIR /app

# --- Prática de Cibersegurança: Usuário Não-Root ---
# Criamos um grupo 'appgroup' e um usuário 'appuser' sem privilégios
# -S = usuário de sistema, sem senha, sem home shell.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia os arquivos do estágio "builder" (node_modules e o código)
# e define o 'appuser' como dono desses arquivos.
COPY --from=builder --chown=appuser:appgroup /usr/src/app ./

# Define o usuário 'appuser' como o usuário que rodará o processo.
# O container não rodará como 'root'.
USER appuser

# Define a variável de ambiente do Timezone (para o tzdata)
ENV TZ="America/Sao_Paulo"

# Define o 'dumb-init' como ponto de entrada
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Comando padrão para iniciar o worker
CMD [ "node", "index.js" ]