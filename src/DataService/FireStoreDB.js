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

  export const optionLiquidity = database.collection('T_Events_Liquidity_New');

  export const getAllOptions = async () => {
    var oData = [];
    var oLiquidityData = [];
    const optionsCount = database.collection('T_Options_New')
    const optionLiquidity = database.collection('T_Events_Liquidity_New');

    await optionLiquidity.get().then(function(responseData) {
      responseData.docs.forEach(doc => {
        oLiquidityData.push(doc.data())
      })
    })
    
    await optionsCount.get().then( function(responseData) {
      responseData.docs.forEach(doc => {
        var data  = doc.data()
        const optionId = data.OptionSetId
        var collateralTotal = 0;
        oLiquidityData.forEach(option => {
          if(option.OptionSetId === optionId) {
            collateralTotal += option.CollateralBalanceLong
            collateralTotal += option.CollateralBalanceShort
          }
        })
        Object.assign(data, {CollateralBalance : collateralTotal})
        oData.push(data);
      }) 
    })
    return oData;
  }

  export const getOptionCollateralUpdates = async (allOptions) => {
    await optionLiquidity.onSnapshot(allOptionsLiquidity => {
      allOptionsLiquidity.docChanges().forEach(change => {
        
        if (change.type === 'added') {
          return mapCollateralUpdate(allOptions, change)
        }
        if (change.type === 'modified') {
          return mapCollateralUpdate(allOptions, change)
        }
        if (change.type === 'removed') {
          return mapCollateralUpdate(allOptions, change)
        }
      });
    });
  }

  function mapCollateralUpdate(allOptions, change) {
    const data = change.doc.data()
    const index = allOptions.findIndex((option) => {return option.OptionSetId === data.OptionSetId})
    //var updatedOption = Object.assign({}, allOptions[index])
    var collateralTotal = allOptions[index].CollateralBalance
    collateralTotal += data.CollateralBalanceLonceng
    collateralTotal += data.CollateralBalanceShort
    //updatedOption.CollateralBalance = collateralTotal
    //Object.assign(allOptions[index].CollateralBalance, updatedOption.CollateralBalance)
    Object.assign(allOptions[index].CollateralBalance, collateralTotal)
    return allOptions
  }

  