import * as React from "react";
import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import './App.css';
import wavePortal from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;
const deployedContractAddress ="0xB4907De7a2532474360f01Cfb7AB010FD19E201b";

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

  const [donation,setDonation]= useState("");
  const [message,setMessage] = useState("");

  //>>>> UPDATE Deployed Contract Address HERE! <<<<<<<
  const contractAddress = deployedContractAddress;
  //"./utils/WavePortal.json" copid from contract's artifact json
  const contractABI = wavePortal.abi;
  
  
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

 
 
  async function pay(_amount) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const signer = provider.getSigner();
  
      // Creating a transaction param
      const tx = {
          from: currentAccount,
          to: deployedContractAddress,
          value: ethers.utils.parseEther(_amount),
          nonce: await provider.getTransactionCount(currentAccount, "latest"),
          gasLimit: ethers.utils.hexlify(300000),
          gasPrice: ethers.utils.hexlify(parseInt(await provider.getGasPrice())),
      };
  
      signer.sendTransaction(tx).then((transaction) => {
          console.dir(transaction);
          alert("We appreciate your generosity!");
      });
    } catch (error) {
      console.log(error);
    }
   
  }

  const testGetValue = (value) => {
    console.log(value);
    //console.log(typeof(parseInt(value)));
  }

  const wave = async (_message) => {
    try {
      //console.log("message:"+_message);
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
        //let randomNumber = Math.floor(Math.random()*1000);
        //let message = "a simple message " + randomNumber;
        let message = _message;

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        //const waveTxn = await wavePortalContract.wave(message, {gasLimit: 300000});
        //console.log("Mining...", waveTxn.hash);

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
    console.log("connectWallet");
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
      
      {/* <!-- Links (sit on top) --> */}
      <div class="w3-top">
        <div class="w3-row w3-padding w3-black">
          <div class="w3-col s3">
            <a href="#" class="w3-button w3-block w3-black">HOME</a>
          </div>
          {/* <div class="w3-col s3">
            <a href="#about" class="w3-button w3-block w3-black">ABOUT</a>
          </div> */}
          {/* <div class="w3-col s3">
            <a href="#menu" class="w3-button w3-block w3-black">MENU</a>
          </div>
          <div class="w3-col s3">
            <a href="#where" class="w3-button w3-block w3-black">WHERE</a>
          </div> */}
        </div>
      </div>
     
   
      
      
      <div class="w3-container bgimg" id="about">
        <div class="w3-content" >
          <h5 class="w3-center w3-padding-64"><span class="w3-tag w3-wide">ABOUT TIBETAN REFUGEES IN INDIA</span></h5>
          <p class="w3-text-white">Tibetan refugees started crossing the Himalayan range in April 1959, in the wake of the Dalai Lama's fight into exile.</p>
          <p class="w3-text-white">For some, the journey ended in Nepal and Bhutan, but India was the final destination of most.</p>
          <p class="w3-text-white">According to the latest demographic survey conducted by the Tibetan Goverment-in-Exile, there are about 95,000 Tibetans in India.</p>
          <div class="w3-panel w3-leftbar w3-light-grey">
            <p><i>"There are more than 100 people in our village, and there is a great need to buy some anti-epidemic items. It would be great if you could help us with these."</i></p>
            <p>Tibetan Refugee, Lobsang</p>
          </div>
          
          <p><strong>Medium Post:</strong> <a href="https://medium.com/@mahayana200/印度西藏居民需要你的幫助-fundraising-for-indian-tibetan-67dec43443b2" title="meidum" target="_blank" class="w3-hover-text-green">Fundraising for Indian Tibetan</a> </p>
         
        </div>
      </div>
      
      
      <div className="dataContainer">
        
        {/* <div className="header">
        Crypto Donation Portal
        </div> */}

        <div className="bio">
        Connect your Ethereum wallet and send a donation to Tibetan refugees in India.
        </div>

         {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="donateButton" onClick={connectWallet}>
            Connect My Wallet
          </button>
        )}


        <div>
            <div className="donation">
                Make a Donation with Crypto: {donation} Goerli ETH
            </div>
            <input id="donationInput-El" className="inputEl" type="text" onChange={(e)=>{setDonation(e.target.value)}}/>

        </div>

        

        <button className="donateButton" onClick={() => pay(donation)} >
          Donate
        </button>

        <div>
            {/* <div className="donation">
                Message to Tibetan Refugees: {message}
            </div> */}
            <div className="donation">
                Message to Tibetan Refugees: 
            </div>
            <input id="donationInput-El" className="inputEl" type="text" onChange={(e)=>{setMessage(e.target.value)}}/>

        </div>
          
        <button className="messageButton" onClick={() => wave(message)} >
          Leave a Message
        </button>
        
        
          
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}

      </div>

     
    <footer class="w3-center w3-light-grey w3-padding-48 w3-large">
      <p>Contact: <a href="https://twitter.com/0xywh?s=21&t=aUMg_czqZopUIjduPZgUNw" title="About the Author" target="_blank" class="w3-hover-text-green">Twitter@0xywh</a></p>
    </footer>
    </div>

    
  );
}
