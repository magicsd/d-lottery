/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BigNumberish,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../common";
import type { Raffle, RaffleInterface } from "../Raffle";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ticketPrice",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "Raffle__NotEnoughValueEntered",
    type: "error",
  },
  {
    inputs: [],
    name: "enter",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256",
      },
    ],
    name: "getPlayer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTicketPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a060405234801561001057600080fd5b506040516103f53803806103f58339818101604052810190610032919061007b565b8060808181525050506100a8565b600080fd5b6000819050919050565b61005881610045565b811461006357600080fd5b50565b6000815190506100758161004f565b92915050565b60006020828403121561009157610090610040565b5b600061009f84828501610066565b91505092915050565b60805161032c6100c96000396000818160af015261011c015261032c6000f3fe6080604052600436106100345760003560e01c806387bb7ae014610039578063e55ae4e814610064578063e97dcb62146100a1575b600080fd5b34801561004557600080fd5b5061004e6100ab565b60405161005b91906101f2565b60405180910390f35b34801561007057600080fd5b5061008b6004803603810190610086919061023e565b6100d3565b60405161009891906102ac565b60405180910390f35b6100a961011a565b005b60007f0000000000000000000000000000000000000000000000000000000000000000905090565b60008082815481106100e8576100e76102c7565b5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b7f0000000000000000000000000000000000000000000000000000000000000000341015610174576040517fd4a89e0500000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b6000819050919050565b6101ec816101d9565b82525050565b600060208201905061020760008301846101e3565b92915050565b600080fd5b61021b816101d9565b811461022657600080fd5b50565b60008135905061023881610212565b92915050565b6000602082840312156102545761025361020d565b5b600061026284828501610229565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102968261026b565b9050919050565b6102a68161028b565b82525050565b60006020820190506102c1600083018461029d565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fdfea2646970667358221220ff1d9a4b1fec9fd81498d297a4ab7417a880a0123e3daf885823fda3ccf602bf64736f6c634300081c0033";

type RaffleConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: RaffleConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Raffle__factory extends ContractFactory {
  constructor(...args: RaffleConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _ticketPrice: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_ticketPrice, overrides || {});
  }
  override deploy(
    _ticketPrice: BigNumberish,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_ticketPrice, overrides || {}) as Promise<
      Raffle & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Raffle__factory {
    return super.connect(runner) as Raffle__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): RaffleInterface {
    return new Interface(_abi) as RaffleInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Raffle {
    return new Contract(address, _abi, runner) as unknown as Raffle;
  }
}
