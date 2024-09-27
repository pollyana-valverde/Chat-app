import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import './App.css';

const socket = io('http://localhost:4000'); // Conectar ao backend

const users = ['Alice', 'Bob', 'Charlie', 'David']; // Lista de usuários existentes

function App() {
  const [messages, setMessages] = useState({}); // Armazena mensagens por par de usuários
  const [input, setInput] = useState('');
  const [username, setUsername] = useState(users[0]); // Nome do usuário padrão
  const [currentChat, setCurrentChat] = useState(users[1]); // Conversa atual com outro usuário

  useEffect(() => {
    // Carregar mensagens do localStorage
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    setMessages(savedMessages);

    socket.on('receiveMessage', (message) => {
      const chatKey = [message.from, message.to].sort().join('-'); // Cria uma chave para o par de usuários
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (!updatedMessages[chatKey]) {
          updatedMessages[chatKey] = [];
        }
        updatedMessages[chatKey].push(message);
        return updatedMessages;
      });
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  useEffect(() => {
    // Salvar mensagens no localStorage
    if (Object.keys(messages).length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input) {
      const newMessage = { text: input, from: username, to: currentChat };
      const chatKey = [newMessage.from, newMessage.to].sort().join('-');
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        if (!updatedMessages[chatKey]) {
          updatedMessages[chatKey] = [];
        }
        updatedMessages[chatKey].push(newMessage);
        return updatedMessages;
      });

      socket.emit('sendMessage', newMessage); // Envia a mensagem via socket
      setInput(''); // Limpa o input
    }
  };

  const handleChatChange = (user) => {
    setCurrentChat(user);
  };

  // Define a chave da conversa fora do JSX
  const chatKey = [username, currentChat].sort().join('-');

  return (
    <div className="App">
      <h1>Chat em Tempo Real</h1>

      <select value={username} onChange={(e) => setUsername(e.target.value)}>
        {users.map((user) => (
          <option key={user} value={user}>
            {user}
          </option>
        ))}
      </select>

      <div className="chat-users">
        {users.map((user) => (
          user !== username && ( // Não renderiza o botão se for o usuário ativo
            <button key={user} onClick={() => handleChatChange(user)}>
              Conversa com {user}
            </button>
          )
        ))}
      </div>

      <div className="chat-window">
        {(messages[chatKey] && messages[chatKey].length > 0) ? (
          messages[chatKey].map((msg, index) => (
            <div key={index} style={{ padding: '5px', 
              textAlign: msg.from === username ? 'right' : 'left',
              backgroundColor: msg.from === username ? '#d1ffd1' : '#f1f1f1',
              borderRadius: '5px',
              margin: '5px 0',
              maxWidth: '100%',
              alignSelf: msg.from === username ? 'flex-end' : 'flex-start'
            }}>
              <strong>{msg.from}:</strong> {msg.text}
            </div>
          ))
        ) : (
          <div style={{ padding: '5px', color: 'gray' }}>
            Nenhuma mensagem ainda.
          </div>
        )}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Digite uma mensagem"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default App;
