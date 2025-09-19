import logo from './logo.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@coral-xyz/anchor';
import { useEffect, useState } from "react";
import { Buffer } from "buffer";
window.Buffer = Buffer;
const programId = new PublicKey(idl.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: 'processed', //finalized
}
const { SystemProgram } = web3;
const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection,
      window.solana,
      opts
    );
    return provider;
  }
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found");
          const response = await solana.connect({
            onlyIfTrusted: true,
          });
          console.log("Connected with public key", response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());

        }
        else {
          alert("Solana object not found: Get a Phantom wallet");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      console.log('Connected with public key', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString());

    }
  }

  const createCampaign = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, provider);
      const [campaign] = await PublicKey.findProgramAddress([
        utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
        provider.wallet.publicKey.toBuffer(),
      ],
        programId
      );
      await program.rpc.create('Campaign name', 'Campaign Description', {
        accounts: {
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        }
      });
      console.log('Created a new campaign w/ address', campaign.toString())
    } catch (error) {
      console.error('Error creating campaign account', error);
    }
  }

  const getCampaigns = async () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = getProvider();
    const program = new Program(idl, provider);
    Promise.all((await connection.getProgramAccounts(programId)).map(async campaign => ({
      ...(await program.account.campaign.fetch(campaign.pubkey)),
      pubkey: campaign.pubkey,
    })
    )
    ).then((campaigns) => setCampaigns(campaigns));

  }

  const donate = async (publicKey) => {
     try {
      const connection = new Connection(network, opts.preflightCommitment);
      const provider = getProvider();
      const program = new Program(idl, provider);
      await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
      });
      console.log("Donated some money to: ", publicKey.toString());
      getCampaigns();
     } catch(error) {
      console.error("Error donating: ", error);
     }
  }

  const renderNotConnectedContainer = () => (
      <button onClick={connectWallet}>Connect to Wallet</button>
  )

  const renderConnectedContainer = () => (
    <>
      <button onClick={createCampaign}>Creating a campaign</button>
      <button onClick={getCampaigns}>Get Campaigns</button>

      <br />
      {campaigns.map(campaign => (
        <>
          <p>Campaign Id: {campaign.pubkey.toString()}</p>
          <p>Balance: {""}
            {(
              campaign.amountDonated / web3.LAMPORTS_PER_SOL
            )}
          </p>
          <p>{campaign.name}</p>
          <p>{campaign.description}</p>
          <button onClick={() => donate(campaign.pubkey)}>Click to donate</button>
        </>
      ))}

    </>
  )
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, [])

  return <div className='App'>
    {!walletAddress && renderNotConnectedContainer()}
    {walletAddress && renderConnectedContainer()}

  </div>
};

export default App;
