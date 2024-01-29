import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Text,
  View,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { SliderTrack, Stack, stackClasses } from "@mui/material";
// import TicTacToe from "./TicTacToeBoard";


export default function App() {
  const socket = useMemo(() => io("http://192.168.1.121:3000"), []);
  
  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomname, setRoomname] = useState("");
  const [game, setGame] = useState({ board: Array(9).fill(null), players: [], currentPlayer: '' });


  const createGameHandler = () => {
    socket.emit('create-game', room);
    setRoom('');
  };


  const makeMoveHandler = (index) => {
    socket.emit('make-move', { room, index });
  };

  
  const renderBoard = () => {
    return (
      <View style={styles.board}>
        {game.board.map((value, index) => (
          <TouchableOpacity
            key={index}
            style={styles.cell}
            onPress={() => makeMoveHandler(index)}
          >
            <Text style={styles.cellText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };



  const handleSubmit = () => {
    socket.emit("message",{message, room});
    setMessage("");
  };

  const joinRoomHandler = () => {
    socket.emit("join-room",roomname);
    socket.emit('join-game', roomname);
    setRoomname("");
  }


  useEffect(() => {
    socket.on("connect", () => {
      setSocketId(socket.id);
      console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    });

    socket.on('game-state', (data) => {
      console.log('Received game state:', data);
      setGame(data);
    });

    socket.on('game-over', (data) => {
      console.log('Game over! Winner:', data.winner);
    });


    socket.on("receive-message", (data) => {
      console.log(data);
      setMessages([...messages, data]);
    });
    socket.on("welcome", (s) => {
      console.log(s);
    });
    return () => {
      socket.disconnect();
    };
  }, []);



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Text style={styles.text}>Socket ID: {socketId}</Text>
      <TextInput
        style={styles.inputStyle}
        value={message}
        placeholder="Message"
        onChangeText={(text) => setMessage(text)}
      />
      <TextInput
        style={styles.inputStyle}
        value={room}
        placeholder="Room Name"
        onChangeText={(text) => setRoom(text)}

      />
      <Button title="Send" onPress={handleSubmit} />
      <TextInput
        style={styles.inputStyle}
        value={roomname}
        placeholder="Room"
        onChangeText={(text) => setRoomname(text)}
      />
      <Button title="Create/Join Room" onPress={joinRoomHandler} />
      <ScrollView>
      {messages.map((m, i) => (
        <View key={i} style={styles.messageContainer}>
          <Text style={styles.messageText}>
            {m}
          </Text>
        </View>
      ))}
    </ScrollView>


      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical : 10,
  },
  inputStyle: {
    height: 42,
    borderWidth: 1,
    borderRadius: 6,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  cell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 48,
  },
  messageContainer: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginVertical: 10,
  },
  messageText: {
    fontSize: 18,
  },
});
