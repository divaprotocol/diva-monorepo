import config.config as config
import time
PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY
from lib.recorder import printb, printn, printbAll, printc

def depositStake(amount, network, w3, contract_approve, contract_deposit, allowance):
    if amount > allowance:
        printbAll("Approving amount...", underline=True)
        printn("TRB token address: %s" % contract_approve.address)
        gas_price = w3.eth.gas_price
        try:
            submit_txn = contract_approve.functions.approve(contract_deposit.address, w3.toWei(int(amount), 'ether')).buildTransaction(
                {
                    "gasPrice": gas_price,
                    "chainId": config.chain_id[network],
                    "from": PUBLIC_KEY,
                    "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
                }
            )

            printn("Nonce: %s" % w3.eth.get_transaction_count(PUBLIC_KEY))

            signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)

            txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)

            printn("")
            printb("Success: ", "Amount approved.", 'green')
            printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
            time.sleep(5)
            try:
                bf = w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0]/1000000000
                gp = transaction_receipt.effectiveGasPrice/1000000000
                gu = transaction_receipt.gasUsed
                printn("Base Fee Per Gas: %s Gwei" % bf)
                printc("Effective Gas Price: ", "%s Gwei" % gp, 'magenta')
                printn("Gas Used: %s" % gu)
            except:
                printn("No Gas Data available at this point.")

        except Exception as err:
            printb("Failure: ", err.args[0].__str__(), 'red')
            return 1
    else:
        printn("Enough allowance. No approval needed.")


    printn("")
    printbAll("Depositing Stake...", underline=True)
    printn("Tellor contract address: %s" % contract_deposit.address)

    gas_price = w3.eth.gas_price
    try:
        submit_txn = contract_deposit.functions.depositStake(w3.toWei(int(amount), 'ether')).buildTransaction(
            {
                "gasPrice": gas_price,
                "chainId": config.chain_id[network],
                "from": PUBLIC_KEY,
                "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
            }
        )

        printn("Nonce: %s" % w3.eth.get_transaction_count(PUBLIC_KEY))

        signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)

        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)

        printn("")
        printb("Success: ", "Stake deposited.", 'green')
        printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
        time.sleep(5)
        try:
            bf = w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0] / 1000000000
            gp = transaction_receipt.effectiveGasPrice / 1000000000
            gu = transaction_receipt.gasUsed
            printn("Base Fee Per Gas: %s Gwei" % bf)
            printc("Effective Gas Price: ", "%s Gwei" % gp, 'magenta')
            printn("Gas Used: %s" % gu)
        except:
            printn("No Gas Data available at this point.")

        try:
            rem = float(w3.fromWei(w3.eth.get_balance(PUBLIC_KEY), 'ether'))
            if rem >= config.acc_balance_threshold:
                printc("Remaining ETH on user account: ", f"{rem} ETH", 'green')
            else:
                printc("Remaining ETH on user account: ", f"{rem} ETH", 'red')
        except:
            printn("Remaining ETH balance not available at this point.")
        return 0


    except Exception as err:
        printb("Failure: ", err.args[0].__str__(), 'red')
        return 1




