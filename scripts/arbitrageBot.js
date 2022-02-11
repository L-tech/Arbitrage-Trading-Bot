require('dotenv').config();

const ethers = require('ethers');
const BigNumber = ethers.BigNumber;
const { Fetcher, Token, WETH, ChainId, TradeType, Percent, Route, Trade, TokenAmount,} = require( '@uniswap/sdk' );

const providerURL = 'http://localhost:8545'; 

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

const testAccountAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const privateKey = process.env.PRIVATE_KEY;

const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const MAX_UINT256 = ethers.constants.MaxUint256;

const ZERO_BN = ethers.constants.Zero;

const Tokens = {

    WETH: WETH[ChainId.MAINNET],

    DAI: new Token( ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18 , 'DAI'),

    BAT: new Token( ChainId.MAINNET, '0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914', 18, 'BAT') ,

    MKR : new Token ( ChainId.MAINNET, '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', 18, 'MKR')

};

const wallet  = getWallet(privateKey);

function getWallet( privateKey ) {
    return new ethers.Wallet( privateKey, provider );
}

const getDeadlineAfter = delta => Math.floor( Date.now() / 1000 ) + ( 60 * Number.parseInt( delta, 10 ) );

const toHex = n => `0x${ n.toString( 16 ) }`;

async function getTokenBalanceInBN(address, tokenContract) {
    const balance = await tokenContract.balanceOf(address);
    return BigNumber.from(balance);
}

async function getTokenBalance(address, tokenContract) {
    const balance = await tokenContract.balanceOf(address);
    const decimals = await tokenContract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
}

async function printAccountBalance(address, privateKey) {
    const balance = await provider.getBalance(address);
    const wethBalance = await getTokenBalance(address, wethContract);
    const daiBalance = await getTokenBalance(address, daiContract);
    const mkrBalance = await getTokenBalance(address, mkrContract);
    const batBalance = await getTokenBalance(address, batContract);
    console.log(`Account balance: ${ethers.utils.formatUnits(balance,18)} ethers, ${wethBalance} weth, ${daiBalance} DAI, ${mkrBalance} MKR, ${batBalance} BAT`);
}
