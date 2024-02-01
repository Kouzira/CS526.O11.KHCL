import React, { useEffect, useMemo, useState, useRef } from "react";
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
  ScrollView,
  Alert
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import TicTacToe from "./TicTacToeBoard";


export default function App() {
  const socket = useMemo(() => io("http://192.168.1.7:3000"), []);

  const [message, setMessage] = useState("");
  const [room, setRoom] = useState("");
  const [socketId, setSocketId] = useState("");
  const [roomname, setRoomname] = useState("");
  const [game, setGame] = useState({ board: Array(9).fill(null), players: [], currentPlayer: '' });
  const [history, setHistory] = useState([]);
  const [receive,setReceive] = useState([]);

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

  const getMessages = async () => {
      try {
        // Lấy danh sách tin nhắn từ AsyncStorage
        
        const messages_his = await AsyncStorage.getItem(roomname);
        
        if (messages_his) {
          // If messages_his is not null or undefined, parse it
          setHistory(JSON.parse(messages_his));
          return JSON.parse(messages_his);
        } else {
          // If messages_his is null or undefined, return an empty array or another default value
          setHistory(['Room name: ' + roomname, 'Hay bat dau cuoc tro chuyen!']);
          return [];
        }
        
      } catch (error) {
        console.error('Lỗi khi lấy tin nhắn:', error);
        return [];
      }
    };
  const getRoomName = async () => {
      console.log('Ten phong:   '+ roomname);
      console.log(typeof(roomname));
      
      return roomname;
  }
  const storeMessage = async (content,rname) => {
      try {
        // Lấy danh sách tin nhắn đã lưu trước đó
        const existingMessages = await AsyncStorage.getItem(rname);
        
        if (existingMessages) {
           newMessages = JSON.parse(existingMessages);
           newMessages.push(content);
        }
        else
        {
           newMessages = ['Room name: ' + rname];
        }

        // Lưu danh sách tin nhắn mới vào AsyncStorage
        await AsyncStorage.setItem(rname, JSON.stringify(newMessages));

      } catch (error) {
        console.error('Lỗi khi lưu trữ tin nhắn:', error);

      }
    };
  const scrollViewRef = useRef();
  const handleContentSizeChange = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };


  const handleSubmit = () => {
    //
    //
    socket.emit("message",{message, room});
    storeMessage(message,roomname).then(() => {getMessages();});
    setMessage("");
  };

  const joinRoomHandler = () => {
    socket.emit("join-room",roomname);
    socket.emit('join-game', roomname);
    getMessages();

    //setRoomname("");
  }

const removeHistoryHandler = () => {
  Alert.alert(
    'Xác nhận xóa lịch sử tin nhắn',
    'Bạn có chắc chắn muốn xóa cuộc hội thoại này?',
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        onPress: async () => {
          try {
            // Xử lý logic xóa tin nhắn ở đây
            await AsyncStorage.removeItem(roomname);
            console.log('Tin nhắn đã bị xóa');
          } catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
          }
        },
      },
    ],
    { cancelable: false }
  );
};

  
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
      setReceive(...receive,data);
    });
    
    socket.on("welcome", (s) => {
      console.log(s);
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  
    
    
////
  useEffect(() => {
      const fetchData = async () => {
        await storeMessage('-> ' + receive, roomname);
        await getMessages();
        if (receive.length > 0) {
          setReceive([]);
        }
      };

      fetchData();
    }, [receive, roomname]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Text style={styles.text}>Socket ID: {socketId}</Text>
      
      <TextInput
        style={styles.inputStyle}
        value={roomname}
        placeholder="Room"
        onChangeText={(text) => setRoomname(text)}
      />
      <Button title="Create/Join Room" onPress={joinRoomHandler} />
      <Text style={styles.text}>Messages</Text>
      
      <ScrollView style={styles.scrollView}
      ref={scrollViewRef}
      onContentSizeChange={handleContentSizeChange}>
        <View style={styles.container}>

          {history.map((item, index) => (
            <View key={index}>
        <Text style={item.startsWith('->') ? styles.indentedText : styles.normalText}>
          {item}
        </Text>
      </View>
          ))}

        </View>
        </ScrollView>
           
      
      
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
      <Button title="Remove History" onPress={removeHistoryHandler} />
        
      {/* <Button title="Create Game" onPress={createGameHandler} />
      {renderBoard()} */}
      
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
  normalText: {
    marginBottom: 10, 
  },
  indentedText: {
    marginLeft: 0, 
    color: 'blue',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
    flexDirection: 'column',

  },
});
