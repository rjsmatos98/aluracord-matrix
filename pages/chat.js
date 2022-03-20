import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React from 'react';
import api from "../src/services/Api";
import appConfig from '../config.json';
import { useRouter } from 'next/router'
import { RiDeleteBack2Fill, RiSendPlane2Fill } from 'react-icons/ri';
import { createClient } from '@supabase/supabase-js';
import { ButtonSendSticker } from '../src/components/ButtonSendSticker';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Z3hraGhtYmJ4cmVmZnFpY3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDY2Mjg3MjEsImV4cCI6MTk2MjIwNDcyMX0.JPs9eebtkElJ8BTTYoFXImLpmtYcoInH6-q39TYl2Z8';
const SUPABASE_URL = 'https://kzgxkhhmbbxreffqictl.supabase.co';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function InsertMessageInRealTime(messageRealTime) {
    return supabaseClient
        .from('message')
        .on('INSERT', (response) => {
            messageRealTime(response.new);
        })
        .subscribe();
}

function DeleteMessageInRealTime(messageRealTime) {
    return supabaseClient
        .from('message')
        .on('DELETE', ({old}) => {
            messageRealTime(old.id);    
        });
}

export default function ChatPage() {
    const roteamento = useRouter();
    const usuarioLogado = roteamento.query.username;
    const [message, setMessage] = React.useState('');
    const [messageList, setMessageList] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        supabaseClient
            .from('message')
            .select('*')
            .order('id', { ascending: false })
            .then(({ data }) => {
                setMessageList(data);
                setIsLoading(false)
            });
        
        const subscription = InsertMessageInRealTime((newMessage) => {
            //console.log('Nova mensagem:', novaMensagem);
            //console.log('listaDeMensagens:', listaDeMensagens);
            setMessageList((currentList) => {
                return [
                    newMessage,
                    ...currentList,
                ]
            });
        });

        DeleteMessageInRealTime((oldId)=>{
            setMessageList((messageList)=>{
                return messageList.filter((message)=>message.id !== oldId)
            });
        });

        return () => {
            subscription.unsubscribe();
        }
    }, []);
    
    /*
    // Usuário
    - Usuário digita no campo textarea
    - Aperta enter para enviar
    - Tem que adicionar o texto na listagem
    
    // Dev
    - [X] Campo criado
    - [X] Vamos usar o onChange usa o useState (ter if pra caso seja enter pra limpar a variavel)
    - [X] Lista de mensagens 
    */

    function handleNewMessage(newMessage) {
        const message = {
            //id: messageList.length + 1,
            from: usuarioLogado,
            text: newMessage,
        };

        supabaseClient
            .from('message')
            .insert([
                // Tem que ser um objeto com os MESMOS CAMPOS da tabela do supabase
                message
            ])
            .then(({data}) => {
                //console.log('Criando mensagem: ', data);
            });

        setMessage('');
    }

    function handleDeleteMessage(id){
        supabaseClient
            .from('message')
            .delete()
            .match({ id:id })
            .then((data) => {
                //alert('Mensagem deletada com sucesso!');
                // setMessageList((oldMessageList) => oldMessageList.filter(message => message.id !== oldId));
            });
    }

    return (
        <Box
            styleSheet={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: appConfig.theme.colors.primary[500],
                backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
                backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
                color: appConfig.theme.colors.neutrals['000']
            }}
        >
            <Box
                styleSheet={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
                    borderRadius: '5px',
                    backgroundColor: appConfig.theme.colors.neutrals[700],
                    height: '100%',
                    maxWidth: '95%',
                    maxHeight: '95vh',
                    padding: '32px',
                }}
            >
                <Header />
                <Box
                    styleSheet={{
                        position: 'relative',
                        display: 'flex',
                        flex: 1,
                        height: '80%',
                        backgroundColor: appConfig.theme.colors.neutrals[600],
                        flexDirection: 'column',
                        borderRadius: '5px',
                        padding: '16px',
                    }}
                >
                    <MessageList 
                        mensagens={messageList} 
                        isLoading={isLoading} 
                        onDeleteMessageClick={(id) => {
                            handleDeleteMessage(id);
                        }}
                    />
                    {/* {messageList.map((currentMessage) => {
                        return (
                            <li key={currentMessage.id}>
                                {currentMessage.from}: {currentMessage.text}
                            </li>
                        )
                    })} */}
                    <Box
                        as="form"
                        styleSheet={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <TextField
                            value={message}
                            onChange={(event) => {
                                const valor = event.target.value;
                                setMessage(valor);
                            }}
                            onKeyPress={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    if(message.length > 0){
                                        handleNewMessage(message);
                                    }
                                }
                            }}
                            placeholder="Insira sua mensagem aqui..."
                            type="textarea"
                            styleSheet={{
                                width: '100%',
                                border: '0',
                                resize: 'none',
                                borderRadius: '5px',
                                padding: '6px 8px',
                                backgroundColor: appConfig.theme.colors.neutrals[800],
                                marginRight: '12px',
                                color: appConfig.theme.colors.neutrals[200],
                            }}
                        />

                        {/* CallBack */}
                        <ButtonSendSticker 
                            onStickerClick={(sticker) => {
                                //console.log('[USANDO O COMPONENTE] Salva esse sticker no banco');
                                handleNewMessage(`:sticker:${sticker}`);
                            }}
                        />
                        
                        <Box
                            title='Enviar mensagem'
                            styleSheet={{
                                cursor: 'pointer',
                                borderRadius: '50%',
                                minWidth: '30px',
                                minHeight: '30px',
                                marginBottom: '8px',
                                marginLeft: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: appConfig.theme.colors.primary[300],
                                filter: 'grayscale(1)',
                                hover:{
                                    filter: 'grayscale(0)',
                                    backgroundColor: appConfig.theme.colors.primary[500],  
                                }
                            }}
                            onClick={() => {
                                if(message.length > 0){
                                    handleNewMessage(message);
                                }
                            }}
                        >
                            <RiSendPlane2Fill />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

function Header() {
    return (
        <>
            <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                <Text variant='heading5'>
                    Chat
                </Text>
                <Button
                    variant='tertiary'
                    colorVariant='neutral'
                    label='Logout'
                    href="/"
                />
            </Box>
        </>
    )
}

function MessageList(props) {
    const [isOpen, setOpenState] = React.useState('');
    const [isId, setIdState] = React.useState('');

    return (
        <Box
            tag="ul"
            styleSheet={{
                overflowY: 'scroll',
                display: 'flex',
                flexDirection: 'column-reverse',
                flex: 1,
                color: appConfig.theme.colors.neutrals["000"],
                marginBottom: '16px',
            }}
        >   
            { props.isLoading ? 
                <Image 
                    styleSheet={{
                        width: '50px', 
                        heigh: '50px',
                        margin: 'auto',    
                    }} 
                    src="./img/loading.gif" 
                    alt="loading..." 
                />
             : 
             props.mensagens.map((message) => {
                return (
                    <Text
                        key={message.id}
                        tag="li"
                        styleSheet={{
                            borderRadius: '5px',
                            padding: '10px',
                            marginBottom: '5px',
                            
                            hover: {
                                backgroundColor: appConfig.theme.colors.neutrals[700],
                            }
                        }}
                    >
                        <Box
                            styleSheet={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                
                            }}
                        >
                            
                            <UserProfile from={message.from} id={message.id}></UserProfile>
                                                        
                            <Box 
                                title={`Apagar mensagem`}
                                styleSheet={{
                                    marginLeft: 'auto',
                                    cursor: 'pointer'
                                }}
                                onClick={()=>{
                                    let response = confirm('Deseja remover essa mensagem?')
                                    if(response){
                                        if (Boolean(props.onDeleteMessageClick)) {
                                            props.onDeleteMessageClick(message.id);
                                        }
                                    }
                                }}
                            >
                                <RiDeleteBack2Fill />
                            </Box>
                            
                        </Box>
                        
                        {message.text.startsWith(':sticker:') ? (
                            <Image 
                                src={message.text.replace(':sticker:', '')} 
                                styleSheet={{
                                    width: '100px',
                                    height: '100px'
                                }}
                            />
                        )
                        : (
                            message.text
                        )}
                    </Text>
                );
            })}
        </Box>
    )
}

export function UserProfile(props) { 
    const [isOpen, setOpenState] = React.useState('');
    const [isId, setIdState] = React.useState('');
    const [user, setUser] = React.useState();
       
    React.useEffect(() => {
        api
            .get(props.from)
            .then((response) => setUser(response.data))
            .catch((err) => {
                console.error("ops! ocorreu um erro" + err);
            });
    }, []);

    return (
      <Box
        styleSheet={{
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Image 
            styleSheet={{
                width: '25px',
                height: '25px',
                borderRadius: '50%',
                display: 'inline-block',
                marginRight: '8px',
            }}
            src={`https://github.com/${props.from}.png`}
            onMouseOver={()=>{
                //alert('passei por cima');
                //UserProfile(true);
                setOpenState(!isOpen);
                setIdState(props.id);
            }}
            
        />
        
        <Text tag="strong">
            {props.from}
        </Text>

        <Text
            styleSheet={{
                fontSize: '10px',
                marginLeft: '8px',
                color: appConfig.theme.colors.neutrals[300],
            }}
            tag="span"
        >
            {(new Date().toLocaleDateString())}
        </Text>
            
        {isOpen && isId == props.id && (   
            <Box
                tag="div"
                styleSheet={{
                    display: 'flex',
                    position: 'absolute',
                    padding: '15px',
                    borderRadius: '1%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                }}                
                onMouseLeave={()=>{
                    setOpenState(false);
                }}
            >   
                <Box 
                    styleSheet={{
                        width: '150px',
                        height: '150px'
                    }}
                >
                    <Image 
                        styleSheet={{
                            borderRadius: '50%',
                            }}
                        src={`https://github.com/${props.from}.png`}
                    />  

                    <Text 
                        tag="a"
                        styleSheet={{
                            textAlign: 'center',
                            paddingTop: '5px',
                            cursor:'pointer'
                        }}
                        onClick={() => (
                            window.open(`https://github.com/${props.from}`,'_blank')
                        )}
                    >
                        {user?.name}
                    </Text>
                </Box>
                <Box 
                    styleSheet={{
                        marginLeft: '12px',
                    }}
                >
                    <Box>
                        <Image
                            src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${props.from}&layout=compact&langs_count=10&theme=panda`}
                        />
                    </Box>
                </Box>
            </Box>
        )}
      </Box>
      
    )
}