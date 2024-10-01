import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import './App.css';

const socket = io('http://localhost:4000'); // Conectar ao backend

const allUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank']; // Lista de usuários existentes

function App() {
  const [messages, setMessages] = useState({}); // Armazena mensagens por par de usuários
  const [input, setInput] = useState('');
  const [username, setUsername] = useState(allUsers[0]); // Nome do usuário logado
  const [currentChat, setCurrentChat] = useState(allUsers['']); // Conversa atual com outro usuário
  const [unreadMessages, setUnreadMessages] = useState({}); // Armazena contagem de mensagens não lidas
  const [showDropdownExcluir, setShowDropdownExcluir] = useState(false); // Estado para controlar o dropdown

  const [showDropdownAddUser, setShowDropdownAddUser] = useState(false); // Estado para controlar o dropdown

  const [showDropdownExcluirAddUser, setShowDropdownExcluirAddUser] = useState(false); // Estado para controlar o dropdown
  const [users, setUsers] = useState([]); // Lista de usuários adicionados ao chat para o usuário atual
  const [availableUsers, setAvailableUsers] = useState([]); // Lista de usuários que podem ser adicionados

  useEffect(() => {
    // Carregar mensagens e notificações do localStorage
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages')) || {};
    const savedUnread = JSON.parse(localStorage.getItem(`unreadMessages_${username}`)) || {};
    const savedUserChats = JSON.parse(localStorage.getItem(`${username}-chatUsers`)) || [username]; // Usuários adicionados para o usuário atual
    const newAvailableUsers = allUsers.filter((user) => !savedUserChats.includes(user)); // Lista de usuários que ainda não foram adicionados

    setMessages(savedMessages);
    setUnreadMessages(savedUnread);
    setUsers(savedUserChats);
    setAvailableUsers(newAvailableUsers);

    // Registrar evento para receber mensagem via socket
    if (!socket.hasListeners('receiveMessage')) {
      socket.on('receiveMessage', (message) => {
        const chatKey = [message.from, message.to].sort().join('-');
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

            // Incrementar a contagem de mensagens não lidas apenas se o usuário logado for o destinatário
            if (message.to === username && message.to !== currentChat) {
              setUnreadMessages((prevUnread) => {
                const updatedUnread = {
                  ...prevUnread,
                  [message.from]: (prevUnread[message.from] || 0) + 1
                };
                localStorage.setItem(`unreadMessages_${username}`, JSON.stringify(updatedUnread));
                return updatedUnread;
              });
            }
          }

          return updatedMessages;
        });
      });
    }

    return () => {
      socket.off('receiveMessage');
    };
  }, [username, currentChat]);

  useEffect(() => {
    // Salvar mensagens e notificações no localStorage sempre que forem atualizadas
    if (Object.keys(messages).length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }

    if (Object.keys(unreadMessages).length > 0) {
      localStorage.setItem(`unreadMessages_${username}`, JSON.stringify(unreadMessages));
    }
  }, [messages, unreadMessages, username]);


  // Função para salvar usuários no localStorage
  const saveUsersToLocalStorage = (newUsers) => {
    localStorage.setItem(`${username}-chatUsers`, JSON.stringify(newUsers));
  };

  const addUserToChat = (user) => {
    // Adiciona o usuário à lista de chats do usuário atual e o remove dos disponíveis
    const newUsers = [...users, user];
    const newAvailableUsers = availableUsers.filter((u) => u !== user);

    setUsers(newUsers);
    setAvailableUsers(newAvailableUsers);

    // Salvar os novos estados no localStorage para o usuário atual
    saveUsersToLocalStorage(newUsers);
    setShowDropdownAddUser(false);

  };


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
        timestamp: new Date()
      };

      // Enviar a mensagem via socket (ela será adicionada pelo evento 'receiveMessage')
      socket.emit('sendMessage', newMessage);
      setInput(''); // Limpa o input
    }
  };

  const handleChatChange = (user) => {
    setCurrentChat(user);
    setShowDropdownExcluir(false);
    setShowDropdownAddUser(false);

    // Zerar a contagem de mensagens não lidas para o usuário selecionado, se o usuário logado for o destinatário
    if (unreadMessages[user]) {
      setUnreadMessages((prevUnread) => {
        const updatedUnread = { ...prevUnread, [user]: 0 };
        localStorage.setItem(`unreadMessages_${username}`, JSON.stringify(updatedUnread));
        return updatedUnread;
      });
    }
  };

  const toggleDropdownExcluir = () => {
    setShowDropdownExcluir((prevState) => !prevState);
  };

  const toggleDropdownAddUser = () => {
    setShowDropdownAddUser((prevState) => !prevState);
  };

  const toggleDropdownExcluirAddUser = (user) => {
    setShowDropdownExcluirAddUser((prevDropdown) => ({
      ...prevDropdown,
      [user]: !prevDropdown[user], // Alterna entre mostrar/esconder
    }));
  };


  //deleta todas as mensagens
  const deleteMessages = () => {
    const chatKey = [username, currentChat].sort().join('-');
    setMessages((prevMessages) => {
      const updatedMessages = { ...prevMessages };
      updatedMessages[chatKey] = []; // Remove as mensagens da conversa atual
      return updatedMessages;
    });
    localStorage.setItem('chatMessages', JSON.stringify(messages)); // Atualiza o localStorage
    setShowDropdownExcluir(false);
  };

  //deleta uma mensagem só
  const deleteOneMessage = (index) => {
    const chatKey = [username, currentChat].sort().join('-');
    setMessages((prevMessages) => {
      const updatedMessages = { ...prevMessages };
      updatedMessages[chatKey] = updatedMessages[chatKey].filter((_, msgIndex) => msgIndex !== index);
      localStorage.setItem('chatMessages', JSON.stringify(updatedMessages)); // Atualiza o localStorage
      return updatedMessages;
    });
  };

  const deleteUnreadNotificacion = (user) => {
    if (unreadMessages[user]) {
      setUnreadMessages((prevUnread) => {
        const updatedUnread = { ...prevUnread, [user]: 0 };
        localStorage.setItem(`unreadMessages_${username}`, JSON.stringify(updatedUnread));
        return updatedUnread;
      });
    }
  }

  const deleteAddUser = (user) => {
    // Remove o usuário da lista de chats
    const newUsers = users.filter((u) => u !== user);
    setUsers(newUsers);

    // Adiciona o usuário de volta à lista de usuários disponíveis
    const newAvailableUsers = [...availableUsers, user];
    setAvailableUsers(newAvailableUsers);

    // Atualiza o localStorage com a nova lista de usuários de chats
    saveUsersToLocalStorage(newUsers);

    // Fechar o dropdown para o usuário removido
    setShowDropdownExcluirAddUser((prevDropdown) => ({ ...prevDropdown, [user]: false }));
  };


  const chatKey = [username, currentChat].sort().join('-');

  return (
    <div className="App">
      <h1>Chat em Tempo Real</h1>
      
      <select value={username} onChange={(e) => setUsername(e.target.value)}>
        {allUsers.map((user) => (
          <option key={user} value={user}>
            {user}
          </option>
        ))}
      </select>

      <div className={`conteinerChat ${currentChat ? '' : 'justUsers'} `}>
        <div className="chat-users">
          <div className='actualChatUsers'>
            {users.map((user) => (
              user !== username && ( // Não renderiza o botão se for o usuário ativo
                <div style={{ display: ' flex', justifyContent: 'space-between' }}>
                  <button key={user} onClick={() => handleChatChange(user)} className={user === currentChat ? 'ativo' : 'inativo'}>
                    Conversa com {user}
                    {/* Mostrar a notificação apenas se houver mensagens não lidas e o usuário logado for o destinatário */}
                    {unreadMessages[user] > 0 && (
                      <span className="notification">{unreadMessages[user]}</span>
                    )}

                  </button>
                  <button type='button' onClick={() => toggleDropdownExcluirAddUser(user)}>
                    ⋮
                  </button>
                  {showDropdownExcluirAddUser[user] && (
                    <div className="dropdown" style={{ position: 'absolute', marginLeft: '5px', right: '65%', zIndex: '99999' }}>
                      <button onClick={() => deleteAddUser(user)}>Remover conversa</button>
                    </div>
                  )}
                </div>
              )
            ))}

          </div>
          <div >
            <button className={`addUserBtn ${showDropdownAddUser ? 'show' : ''}`} onClick={toggleDropdownAddUser} >
              + adicionar conversa
            </button>
            {showDropdownAddUser && (
              <div className="dropdownAddUser" style={{ position: 'absolute', display: 'flex', flexDirection: 'column' }}>
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <button
                    className='userAddition'
                      key={user}
                      onClick={() => addUserToChat(user)}
                    >
                      Adicionar {user}
                    </button>
                  ))
                ) : (
                  <p>Todos foram adicionados.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="chat-window">
          <div className="intoChat-users">
            {users.map((user) => (
              user === currentChat && (
                <>
                  <h4>{user}</h4>
                  <div style={{ textAlign: 'right' }}>
                    <p onClick={toggleDropdownExcluir} style={{ cursor: 'pointer' }}>
                      ⋮
                    </p>

                    {showDropdownExcluir && (
                      <div className="dropdown" style={{ position: 'absolute' }}>
                        <button onClick={deleteMessages}>Excluir Mensagens</button>
                      </div>
                    )}
                  </div>
                </>
              )
            ))}
          </div>
          {(messages[chatKey] && messages[chatKey].length > 0) ? (
            <div className='chatContent'>
              {messages[chatKey].map((msg, index) => {
                const messageDate = new Date(msg.timestamp);
                const prevMessageDate = index > 0 ? new Date(messages[chatKey][index - 1].timestamp) : null;

                return (
                  <React.Fragment key={index}>

                    {/* Exibir "Hoje" se a mensagem for de hoje e a anterior não for */}
                    {isToday(messageDate) && (!prevMessageDate || !isToday(prevMessageDate)) && (
                      <div className="date-header">Hoje</div>
                    )}

                    {/* Exibir "Ontem" se a mensagem for de ontem e a anterior não for */}
                    {isYesterday(messageDate) && (!prevMessageDate || (!isYesterday(prevMessageDate) && !isToday(prevMessageDate))) && (
                      <div className="date-header">Ontem</div>
                    )}

                    <div
                      className={`mensagem ${msg.from === username ? 'enviada' : 'recebida'}`}
                      onClick={() => deleteOneMessage(index)} // Chama a função ao clicar na mensagem
                      style={{ cursor: 'pointer' }} // Adiciona um cursor para indicar que é clicável
                    >
                      <div className='mensagemContent'>
                        <p>{msg.text}</p>
                        <div className="messageTimestamp" style={{ fontSize: '0.8em', color: 'gray' }}>
                          {messageDate.toLocaleTimeString()} {/* Exibe o horário da mensagem */}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div className='chatContent' style={{ margin: '7.5px 0', color: 'gray' }}>
              Nenhuma mensagem ainda.
            </div>
          )}

          <form className='chat-form' onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Digite uma mensagem"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      </div>
      <div>
        {availableUsers.length > 0 ? (
          availableUsers.map((user) => (
            availableUsers && ( // Não renderiza o botão se for o usuário ativo
              <div   key={user} >
                {unreadMessages[user] > 0 && (
                  <div className='nonAdditionNotification' style={{ display: 'flex' }}>
                    <p>
                      <span>{user}</span> enviou {unreadMessages[user]} mensagens
                    </p>
                    <button className='add' type='button' onClick={() => addUserToChat(user)}>
                      Adicionar
                    </button>
                    <button className='delete' type='button' onClick={() => deleteUnreadNotificacion(user)}>
                      Exluir
                    </button>
                  </div>
                )}
              </div>
            ))
          )) :
          (
            <>nenhuma notificação</>
          )}
      </div>
    </div>
  );
}

export default App;

