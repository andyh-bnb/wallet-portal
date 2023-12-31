import * as React from "react";
import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import './App.css';
import wavePortal from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  console.log("findMetaMaskAccount");
  try {
    const ethereum = getEthereumObject();

    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  //WalletPortal address previously deployed
  const [allWaves, setAllWaves] = useState([]);

  //>>>> UPDATE Deployed Contract Address HERE! <<<<<<<
  const contractAddress = "0x11301428D6c3D384e22154A1732665b7F493b6CA";
  //"./utils/WavePortal.json" copid from contract's artifact json
  const contractABI = wavePortal.abi;
  
  // const checkIfWalletIsConnected = async () => {
  //   console.log("checkIfWalletIsConnected");
  //   try {
  //     const { ethereum } = window;

  //     if (!ethereum) {
  //       console.log("Make sure you have metamask!");
  //       return;
  //     } else {
  //       console.log("We have the ethereum object", ethereum);
  //     }

  //     const accounts = await ethereum.request({ method: 'eth_accounts' });

  //     if (accounts.length !== 0) {
  //       const account = accounts[0];
  //       console.log("Found an authorized account:", account);
  //       setCurrentAccount(account)
        
  //       //Get a cleaned message log     
  //       // const provider = new ethers.providers.Web3Provider(ethereum);
  //       // const signer = provider.getSigner();
  //       // const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  //       // const waves = await wavePortalContract.getAllWaves();
  //       refreshAllWaves();

  //     } else {
  //       console.log("No authorized account found")
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  const refreshAllWaves = async () => {
    try {
      console.log("refreshAllMsgs");
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        //Call the getAllWaves method from the Smart Contract        
        const waves = await wavePortalContract.getAllWaves();


        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        
        //Store our data in React State
        setAllWaves(wavesCleaned);

        //Get Message Count
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total msg count...", count.toNumber());

        // Execute the sending wave msg from the smart contract
        let randomNumber = Math.floor(Math.random()*1000);
        let message = "a simple message " + randomNumber;

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total  msg count...", count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
}
  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Need a Wallet or MetaMask.");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

 useEffect(() => {

    findMetaMaskAccount().then((account) => {
      if (account !== null) {
        setCurrentAccount(account);
        refreshAllWaves();
      }
    });

    //checkIfWalletIsConnected();
    //Event listener
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Wallet Message Portal
        </div>

        <div className="bio">
        Connect your Ethereum wallet and send a message to me.
        </div>

        <button className="waveButton" onClick={wave}>
          Send a wave msg at Me
        </button>

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

      </div>
    </div>
  );
}
