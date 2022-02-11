import 'ABIConstants.js';
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

function constructContract( smAddress, smABI, privateKey ) {
    const signer = new ethers.Wallet( privateKey );
    return new ethers.Contract(
        smAddress,
        smABI,
        signer.connect( provider )
    )
}

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

const wethContract = constructContract(Tokens.WETH.address, IERC20_ABI, privateKey);
const daiContract = constructContract(Tokens.DAI.address, IERC20_ABI, privateKey);
const mkrContract = constructContract(Tokens.MKR.address, IERC20_ABI, privateKey);
const batContract = constructContract(Tokens.BAT.address, IERC20_ABI, privateKey);

const uniswap = constructContract(   //v2 router
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapABI,
    privateKey,               
);

const sushiswap  = constructContract(
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    sushiswapABI,
    privateKey,
);
async function checkAndApproveTokenForTrade(srcTokenContract, userAddress, srcQty, factoryAddress) {
    console.log(`Evaluating : approve ${srcQty} tokens for trade`);
    if (srcTokenContract.address == ETH_ADDRESS) {
      return;
    }
    let existingAllowance = await srcTokenContract.allowance(userAddress, factoryAddress);
      console.log(`Existing allowance ${existingAllowance}`);
    if (existingAllowance.eq(ZERO_BN)) {
      console.log(`Approving contract to max allowance ${srcQty}`);
      await srcTokenContract.approve(factoryAddress, srcQty);
    } else if (existingAllowance.lt(srcQty)) {
      // if existing allowance is insufficient, reset to zero, then set to MAX_UINT256
  
      //setting approval to 0 and then to a max is suggestible since  if the address already has an approval, 
      //setting again to a max would bump into error
      console.log(`Approving contract to zero, then max allowance ${srcQty}`);
      await srcTokenContract.approve(factoryAddress, ZERO_BN);
      await srcTokenContract.approve(factoryAddress, srcQty);
    } 
    return;
}

async function constructTradeParameters( tokenA, tokenB, tokenAmount ) {
    const slippageTolerance = new Percent( '50', '100' );
    const pair = await Fetcher.fetchPairData( tokenA, tokenB );
    const route = new Route( [pair], tokenA );
    const trade = new Trade(
        route,
        new TokenAmount( tokenA, tokenAmount ),
        TradeType.EXACT_INPUT,
    );
    const minimumAmountOut = trade.minimumAmountOut( slippageTolerance );
    console.log(`minimumAmountOut is ${minimumAmountOut.raw}`);
    return {
        amountOutMin : minimumAmountOut,
        amountOutMinRaw : minimumAmountOut.raw,
        value: toHex( trade.inputAmount.raw )
    };

}
  