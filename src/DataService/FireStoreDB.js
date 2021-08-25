import firebase from "firebase/app";
import "firebase/database";
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDdYKD_rbV2ssyZOlXYc6by6-AxgWQfpz4",
    authDomain: "divaprotocol-7afc0.firebaseapp.com",
    databaseURL: "https://divaprotocol-7afc0-default-rtdb.firebaseio.com/",
    projectId: "divaprotocol-7afc0",
    storageBucket: "divaprotocol-7afc0.appspot.com",
    messagingSenderId: "753300443145",
    appId: "1:753300443145:web:b5df12e21e8db85b6068d8",
    measurementId: "G-DNP0BT03CD"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  } else {
    firebase.app(); // if already initialized, use that one
  }

  const database = firebase.firestore()
  export const optionsCount = database.collection('T_Options_New')