"use client";

import { useEffect, useRef, useState } from "react";

// Note: Updated role to allow put item in improv-roomsm table https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/roles/details/websocket-api-chat-app-tu-SendMessageHandlerService-CDPtU3gVa3J6?section=permissions

// ToDo: Remove key, code, and dependency
const openAiKey = '';
import OpenAI from "openai";
import ProgressBar from "../components/ProgressBar";
import OptionsList from "../components/OptionList";
const openai = new OpenAI({ apiKey: openAiKey, dangerouslyAllowBrowser: true });
async function generateAiResponse(scene, characters, messages) {
  const content = `
  You are a world-class improv actor in the middle of a scene.
  The scene is: ${scene}.
  The characters are: ${JSON.stringify(characters)}.
  Your character is ${characters[1].name}.
  You will improvise ${characters[1].name}'s next line, even if ${characters[1].name} was the last character to speak.
  You will never respond as ${characters[0].name}.
  Your response will be a valid stringified JSON object with this structure: { speaker: string, line: string}.
  `;
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content },
      ...messages.map(message => ({ role: "user", content: JSON.stringify(message) }))
    ],
    model: "gpt-3.5-turbo",
  });
  const response = completion.choices[0].message.content;
  console.log(response);
  return JSON.parse(response);
}

async function generateOptions(scene, characters, messages) {
  const content = `
  I am an improv actor in the middle of a scene and you are my assistant.
  The scene is: ${scene}.
  The characters are: ${JSON.stringify(characters)}.
  My character is ${characters[0].name}.
  You will suggest 3 options for my next line.
  Your response must be a valid JavaScript array of strings and nothing else.
  `;
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content },
      ...messages.map(message => ({ role: "user", content: JSON.stringify(message) }))
    ],
    model: "gpt-3.5-turbo",
  });
  const response = completion.choices[0].message.content;
  console.log(response);
  return JSON.parse(response);
}

async function generateScenePrompt({ messages }) {
  const content = `
  You are the host of an improv show where your job is to introduce prompts throughout the performance as if you are the scene narrator.
  You have taken into consideration the full performance thus far and have thought of the perfect prompt.
  Your response will be a valid stringified JSON object with this structure: { isPrompt: boolean, prompt: string } where isPrompt is true and prompt is your prompt.
  `;
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content },
      ...messages.map(message => ({ role: "user", content: JSON.stringify(message) }))
    ],
    model: "gpt-3.5-turbo",
  });
  const response = completion.choices[0].message.content;
  console.log(response);
  return JSON.parse(response);
}

function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

async function generateImage(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  console.log(response)
  const image_url = response.data[0].url;
  console.log(image_url);
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [{ scene, characters }, setScene] = useState({ scene: '', characters: [] });
  const [responseOptions, setResponseOptions] = useState([]);

  const [currentCharacter, setCurrentCharacter] = useState(String(Date.now())); // ToDO
  const [resetTextTimeout, setResetTextTimeout] = useState(null);
  const [activeMessages, setActiveMessages] = useState({});
  const [messageHistory, setMessageHistory] = useState([]);
  const [roomId, setRoomId] = useState('');

  const messagesEndRef = useRef(null);

  /**
   * On ...
   */
  useEffect(() => {
    if (socket) {
      const messageHandler = (event) => {
        console.log("Message from server ", event.data);
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'joinRoom':
            setRoomId(message.data.roomId);
            break;
          case 'activeMessages':
            if (!message.data[currentCharacter]) {
              // Partial update
              if (message.data[Object.keys(message.data)[0]].timestamp > (activeMessages[Object.keys(message.data)[0]]?.timestamp || 0)) {
                setActiveMessages(activeMessages => ({ ...activeMessages, ...message.data }));
              }
            }
            break;
          case 'messageHistory':
            // Full update
            setMessageHistory(message.data);
            setActiveMessages(activeMessages => ({ ...activeMessages, [message.data.newMessage.character]: '' }));
            break;
          default:
            console.log(`Unknown message type: ${message.type}.`);
            break;
        }
      }
      socket.addEventListener("message", messageHandler);

      return () => {
        socket.removeEventListener("message", messageHandler);
      };
    }
  }, [socket, activeMessages, messageHistory]);

  /**
   * On mount
   */
  useEffect(() => {
    setScene(getRandomElement(scenes));
    const endpoint = 'wss://yovrwsuqx8.execute-api.us-east-1.amazonaws.com/production/';
    const socket = new WebSocket(endpoint);
    const openHandler = () => {
      console.log('Connected to server.');
      setSocket(socket);
      // Join
      const request = {
        'action': 'sendmessage',
        message: JSON.stringify({ type: 'joinRoom' })
      };
      socket.send(JSON.stringify(request));
    };
    socket.addEventListener("open", openHandler);
    return () => {
      socket.removeEventListener('open', openHandler);
      socket.close();
    };
  }, []);

  /**
   * On messageHistory change
   */
  useEffect(() => {
    scrollToBottom();
    saveScene();
  }, [messages]);

  /**
   * On activeMessage change
   */
  useEffect(() => {
    const handleTimeout = () => {
      window.clearTimeout(resetTextTimeout);
      const newTimeout = setTimeout(() => {
        setNewMessageText('');
        setActiveMessages({ ...activeMessages, [currentCharacter]: {} });
        const request = {
          'action': 'sendmessage',
          message: JSON.stringify({ type: 'messageHistory', data: { roomId, newMessage: { character: currentCharacter, line: activeMessages[currentCharacter].message } } })
        };
        socket.send(JSON.stringify(request));
      }, 3000);
      setResetTextTimeout(newTimeout);
    };

    const keypressHandler = (event) => {
      setNewMessageText(newMessageText => newMessageText + event.key);
      const updatedMessage = {
        [currentCharacter]: { timestamp: Date.now(), message: (activeMessages[currentCharacter]?.message || '') + event.key }
      };
      setActiveMessages({ ...activeMessages, ...updatedMessage });
      const request = {
        'action': 'sendmessage',
        message: JSON.stringify({ type: 'activeMessages', data: updatedMessage })
      };
      socket.send(JSON.stringify(request));
      handleTimeout();
    };
    window.addEventListener('keypress', keypressHandler);

    const keydownHandler = (event) => {
      if (event.key === 'Backspace') {
        // ToDo: Socket logic
        setNewMessageText(newMessageText => newMessageText.slice(0, -1));
        setActiveMessages(activeMessages => ({ ...activeMessages, [currentCharacter]: activeMessages[currentCharacter].slice(0, -1) }))
        handleTimeout();
      }
    };
    window.addEventListener('keydown', keydownHandler);

    return () => {
      window.removeEventListener("keypress", keypressHandler);
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [newMessageText, activeMessages, socket]);

  /**
   * Component methods
   */
  const saveScene = () => {
    window.localStorage.setItem('improv-scenes', JSON.stringify({ scene, characters, messages }));
  };

  const getScene = () => {
    return window.localStorage.getItem('improv-scenes');
  };

  const handleSendClick = async () => {
    if (!newMessageText) return;
    console.log('Sending message');
    const message = {
      speaker: characters[0].name,
      line: newMessageText
    };
    const request = { 'action': 'sendmessage', message: JSON.stringify(message) };
    socket.send(JSON.stringify(request));
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessageText('');
    const aiResponse = await generateAiResponse(scene, characters, updatedMessages);
    setMessages([...updatedMessages, aiResponse]);
    const options = await generateOptions(scene, characters, [...updatedMessages, aiResponse]);
    setResponseOptions(options);
  };

  const handleAiClick = async (isPrompt) => {
    const aiResponse = isPrompt ? await generateScenePrompt({ messages }) : await generateAiResponse(scene, characters, messages);
    setMessages([...messages, aiResponse]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendClick();
    }
  };

  /**
   * Render
   */
  return (
    <main className="flex fixed inset-0 flex-col items-center p-12">
      <div className="mb-4">
        <strong className="font-bold">Scene: </strong>{scene}
        <ul className="list-disc ml-5">
          {characters.map(({ name, description }, index) => (
            <li key={index} className="mt-1">
              <strong className="font-bold">{name}:</strong> {description}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 overflow-auto">
        {messages.map((message, index) => message.isPrompt ? message.prompt : (
          <div key={index} className={`flex flex-col items-${message.speaker === characters[0].name ? 'end' : 'start'} mb-2`}>
            <span className={`text-xs ${message.speaker === characters[0].name ? 'text-blue-400' : 'text-gray-600'}`}>
              {message.speaker}
            </span>
            <div className={`p-2 rounded-lg text-white ${message.speaker === characters[0].name ? 'bg-blue-400' : 'bg-gray-800'}`}>
              {message.line}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="mt-5" />
      </div>

      <div>
        {Object.keys(activeMessages).map((character) => (
          <p>{activeMessages[character].message}</p>
        ))}
      </div>

      <div className="mb-5 w-full">
        <ProgressBar seconds={30} />
      </div>

      <div className="mb-5 w-full">
        <OptionsList options={responseOptions} onSelect={setNewMessageText} />
      </div>

      <div className="container mx-auto fixed inset-x-0 bottom-0 mb-4">
        <div className="sticky bottom-0 bg-white border-t border-gray-300 rounded-lg p-2">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 outline-none px-2 py-1 text-sm text-black"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyUp={handleKeyPress}
            />
            <button onClick={handleSendClick} className="ml-2 bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold">Send</button>
            <button onClick={() => handleAiClick(false)} className="ml-2 bg-blue-800 text-white rounded-full px-3 py-1 text-sm font-semibold">AI Reply</button>
            <button onClick={() => handleAiClick(true)} className="ml-2 bg-blue-800 text-white rounded-full px-3 py-1 text-sm font-semibold">AI Prompt</button>
          </div>
        </div>
      </div>
    </main>
  );
}

const scenes = [
  {
    "scene": "A detective interrogates a suspect who turns out to be his long-lost sibling.",
    "characters": [
      {
        "name": "Detective Marcus Black",
        "description": "Seasoned, mid-40s detective, sharp and dedicated, carries past failures, seeks justice."
      },
      {
        "name": "Suspect Sarah Rivers",
        "description": "Early 40s, intelligent, rebellious, on the run for years, longing for connection."
      }
    ]
  },
  {
    "scene": "In the heart of a bustling city, a young graffiti artist races against time to finish a mural before it's painted over by authorities.",
    "characters": [
      {
        "name": "Alex 'Tagger' Thompson",
        "description": "A talented graffiti artist in their mid-20s, rebellious, passionate about their art, and determined to leave a mark on the city."
      },
      {
        "name": "Officer Michelle Chang",
        "description": "A no-nonsense police officer in her late 30s, duty-bound, but with a hidden appreciation for street art, torn between enforcing the law and recognizing artistic expression."
      }
    ]
  },
  {
    "scene": "At a high-stakes poker game in a dimly lit underground casino, tensions rise as players suspect one of them is cheating.",
    "characters": [
      {
        "name": "Jack 'Ace' Anderson",
        "description": "A suave and confident professional poker player in his early 30s, known for his impeccable poker face and strategic gameplay."
      },
      {
        "name": "Lena 'Lady Luck' Ramirez",
        "description": "A mysterious and alluring woman in her late 20s, a skilled cardsharp with a knack for reading opponents, hiding her true intentions behind a charming facade."
      }
    ]
  },
  {
    "scene": "On a remote island, a group of survivors must work together to escape a series of deadly traps set by a deranged game master.",
    "characters": [
      {
        "name": "Ethan 'Survivor' Miller",
        "description": "A resourceful and courageous former soldier in his early 30s, haunted by past traumas but determined to lead the group to safety."
      },
      {
        "name": "Dr. Amelia 'Brain' Carter",
        "description": "A brilliant but socially awkward scientist in her late 20s, relies on logic and reason to solve puzzles, navigating the traps with calculated precision."
      }
    ]
  },
  {
    "scene": "In a futuristic cityscape, a rebel hacker plots to bring down a corrupt government by infiltrating their highly secure data center.",
    "characters": [
      {
        "name": "Ryan 'Byte' Davis",
        "description": "A skilled hacker in his mid-20s, rebellious, with a sharp intellect and a knack for bypassing security systems."
      },
      {
        "name": "Agent Ava 'Cipher' Reyes",
        "description": "A determined government agent in her early 30s, skilled in cyber warfare, tasked with stopping the hacker at any cost, but harboring doubts about the system she serves."
      }
    ]
  }
];
