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
  const [showDropdown, setShowDropdown] = useState(false); // Estado para controlar o dropdown

  useEffect(() => {
    // Carregar mensagens do localStorage
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    setMessages(savedMessages);

    // Garantir que o socket seja registrado apenas uma vez
    if (!socket.hasListeners('receiveMessage')) {
      socket.on('receiveMessage', (message) => {
        const chatKey = [message.from, message.to].sort().join('-'); // Cria uma chave para o par de usuários
        setMessages((prevMessages) => {
          const updatedMessages = { ...prevMessages };
          if (!updatedMessages[chatKey]) {
            updatedMessages[chatKey] = [];
          }

          // Verificar se a mensagem já foi recebida para evitar duplicação
          const isMessageDuplicated = updatedMessages[chatKey].some(
            (msg) => msg.text === message.text && msg.from === message.from && msg.to === message.to
          );

          if (!isMessageDuplicated) {
            updatedMessages[chatKey].push(message);
          }

          return updatedMessages;
        });
      });
    }

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

  // Função para determinar se a data é de "Hoje"
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Função para determinar se a data é de "Ontem"
  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input) {
      const newMessage = {
        text: input,
        from: username,
        to: currentChat,
        timestamp: new Date() // Salva a data completa
      };

      // Enviar a mensagem via socket (ela será adicionada pelo evento 'receiveMessage')
      socket.emit('sendMessage', newMessage);
      setInput(''); // Limpa o input
    }
  };

  const handleChatChange = (user) => {
    setCurrentChat(user);
    setShowDropdown(false); // Esconder dropdown ao mudar de chat
  };

  const toggleDropdown = () => {
    setShowDropdown((prevState) => !prevState); // Alterna a visibilidade do dropdown
  };

  const deleteMessages = () => {
    const chatKey = [username, currentChat].sort().join('-');
    setMessages((prevMessages) => {
      const updatedMessages = { ...prevMessages };
      updatedMessages[chatKey] = []; // Remove as mensagens da conversa atual
      return updatedMessages;
    });
    localStorage.setItem('chatMessages', JSON.stringify(messages)); // Atualiza o localStorage
    setShowDropdown(false); // Fecha o dropdown
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

      <div className='conteinerChat'>
        <div className="chat-users">
          {users.map((user) => (
            user !== username && ( // Não renderiza o botão se for o usuário ativo
              <button key={user} onClick={() => handleChatChange(user)} className={user === currentChat ? 'ativo' : 'inativo'}>
                Conversa com {user}
              </button>
            )
          ))}
        </div>

        <div className="chat-window">
          <div className="intoChat-users">
            {users.map((user) => (
              user === currentChat && (
                <>
                  <h4>{user}</h4>
                  <div style={{textAlign: 'right'}}>
                    <p onClick={toggleDropdown} style={{ cursor: 'pointer' }}>
                      ...
                    </p>

                    {/* Dropdown para excluir mensagens */}
                    {showDropdown && (
                      <div className="dropdown" style={{position: 'absolute'}}>
                        <button onClick={deleteMessages}>Excluir Mensagens</button>
                      </div>
                    )}
                  </div>
                </>
              )
            ))}
          </div>
          {(messages[chatKey] && messages[chatKey].length > 0) ? (
            <>
              {messages[chatKey].map((msg, index) => {
                const messageDate = new Date(msg.timestamp); // Obtém a data de envio da mensagem

                // Exibe o cabeçalho de "Hoje" ou "Ontem" conforme a data da mensagem
                return (
                  <React.Fragment key={index}>

                    {index === 0 || (!isToday(new Date(messages[chatKey][index - 1].timestamp)) && isToday(messageDate)) ? (
                      <div className="date-header">Hoje</div>
                    ) : null}

                    {index === 0 || (!isYesterday(new Date(messages[chatKey][index - 1].timestamp)) && isYesterday(messageDate)) ? (
                      <div className="date-header">Ontem</div>
                    ) : null}

                    <div className={`mensagem ${msg.from === username ? 'enviada' : 'recebida'}`}>
                      <div className='mensagemContent'>
                        <strong>{msg.from}</strong> {msg.text}
                        <div className="timestamp" style={{ fontSize: '0.8em', color: 'gray' }}>
                          {messageDate.toLocaleTimeString()} {/* Exibe o horário da mensagem */}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          ) : (
            <div style={{ padding: '5px', color: 'gray' }}>
              Nenhuma mensagem ainda.
            </div>
          )}
        </div>
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
