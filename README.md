# Projeto de chat com websocket.io

baseado em react.js, node.js e express

## Funcionalidades
- Permite enviar e receber mensagens em tempo real;
- As mensagens enviadas e recebidas tem configurações diferentes;
- Permite que as mensagens sejam armazedas entre o user que enviou e o que recebeu;
- Permite que ao trocar de usuário, as mensagens e conversas disponíveis mudem;

**Criando o projeto:**

## front-end

1. criar o projeto react e instalar as dependencias

````
npx create-react-app chat-frontend
cd chat-frontend
npm install socket.io-client
````

2. rodar o front-end

````
npm start
````

## back-end

1. criar o diretório do back-end

````
mkdir chat-backend
cd chat-backend
npm init -y
````

2. instalar dependências

````
npm install express socket.io
````

3. criar o arquivo server.js

4. rodar o back-end

````
node server.js
````

## Estrutura de Arquivos

    chat-app/
    ├── chat-backend/
    │   └── server.js
    ├── chat-frontend/
    │   ├── public/
    │   ├── src/
    │   │   ├── App.js
    │   │   ├── index.js  
    │   │   ├── index.css
    │   │   └── App.css
    │   └── ...
    └── README.md
