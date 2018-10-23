import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet, AppState, DeviceEventEmitter, AsyncStorage } from "react-native";
import { Router, Stack, Scene, Modal, Actions } from 'react-native-router-flux';
import PushNotification from 'react-native-push-notification';
import socketIOClient from "socket.io-client";
import Login from './src/components/Login';
import Register from './src/components/Register';
import Home from './src/components/Home';
import Products from './src/components/Products';
import Content from './src/components/Content';
import ContentSearch from './src/components/ContentSearch';
import BoxChat from './src/components/BoxChat';
import ListUser from './src/components/ListUser';
import Chats from './src/components/Chats';
import Demo2 from './src/components/Demo2';
export default class App extends Component {
  constructor(props) {
    super(props);
    this.user_id = 0;
    this.state = {
      appState: AppState.currentState,
      endpoint: "http://112.213.88.117:8080",
      check: false,
      user_id: 0,
      isMounted: false
    }
  }
  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("send_user", function (msg) {
      // console.warn(msg);
      AsyncStorage.getItem('key', (err, result) => {
        const item = JSON.parse(result);
        if (msg.send_user_id === item.user_id) {
          PushNotification.localNotificationSchedule({
            //... You can use all the options from localNotifications
            id: (Math.floor(Date.now() / 1000) + (5 * 1000)).toString(), // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
            ticker: "Thông báo mới!", // (optional)
            autoCancel: true, // (optional) default: true
            largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
            smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
            // bigText: "Title:"+sms, // (optional) default: "message" prop
            color: "red", // (optional) default: system default
            vibrate: true, // (optional) default: true
            vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
            title: "Title:" + msg.sms,
            message: "Content:" + msg.sms, // (required)
            date: new Date(Date.now() + (5 * 1000)), // in 60 secs
            number: '10',
            actions: '["Yes", "No"]'
          });
          PushNotification.registerNotificationActions(['Accept', 'Reject', 'Yes', 'No']);
          DeviceEventEmitter.addListener('notificationActionReceived', function (action) {
            //  console.log ('Notification action received: ' + action);
            const info = JSON.parse(action.dataJSON);
            if (info.action == 'Yes') {
              fetch('http://112.213.88.117:8080/app/lists/boxchat/send/id', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: msg.user_id,
                  send_user_id: msg.send_user_id,
                })
              })
                .then((response) => response.json())
                .then((responseJson) => {
                  if (responseJson.box_chat_id != -1) {
                    Actions.chats({ "user_id": msg.user_id, "send_user_id": msg, "box_chat_id": responseJson.box_chat_id });
                  }
                  else {
                    Actions.listuser({ "user_id": msg.user_id });
                  }
                })
                .catch((error) => {
                  console.error(error);
                });

            } else if (info.action == 'No') {
              // Do work pertaining to Reject action here
            }
            // Add all the required actions handlers
          });
        }

      });


    });

  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }
  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      // PushNotification.localNotificationSchedule({
      //   message: "My Notification Message",
      //   date: new Date(Date.now() + (5 * 1000))
      // });
    }
    this.setState({ appState: nextAppState });
  }
  async retrieveItem(key) {
    try {
      const retrievedItem = await AsyncStorage.getItem(key);
      const item = JSON.parse(retrievedItem);
      return item;
    } catch (error) {
      console.log(error.message);
    }
    return
  }
  render() {
    return (
      <Router>
        <Modal key="root" hideNavBar={true}>
          <Scene key="home" component={Home} />
          <Scene key="login" component={Login} title="Login" initial={true} />
          <Scene key="register" component={Register} title="Register" />
          <Scene key="products" component={Products} title="Products" />
          <Scene key="content" path={"/content/:link/"} component={Content} hideNavBar={false} title="Video" />
          <Scene key="contentsearch" path={"/contentsearch/:link/"} component={ContentSearch} hideNavBar={false} title="Search video" />
          <Scene key="boxchat" path={"/boxchat"} component={BoxChat} hideNavBar={false} />
          <Scene key="listuser" component={ListUser} hideNavBar={false} title="Lists friend" />
          <Scene key="chats" component={Chats} hideNavBar={true} />
          <Scene key="demo2" component={Demo2} hideNavBar={true} />
        </Modal>
      </Router>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',


  },

});
