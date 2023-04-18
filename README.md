# etherscan-exporter

Simple script to export transactions from Etherscan into a CSV file and not be blocked by the 5k limit on the UI

## Introduction

This script is used to export all transactions of a unique address into a CSV file.

It can also be used to get other data by changing the API endpoint called inside the script (internal transactions, ERC20 transfers, ERC721 transfers...). All possible endpoint are defined in the Etherscan [documentation](https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-normal-transactions-by-address)

## How to use

### Install

```sh
git clone https://github.com/flbouchut/etherscan-exporter
npm install
```

### Configure

First create a `.env` file and insert you Etherscan API key inside it as showed in `.env.example`

Inside the script, replace the following :

1. `address`: Address you want to extract transactions from
2. `startblock`: First block of the extract. (0 if you want to get all transactions)
3. `endblock`: Last block of the extract. (99999999 if you want to get all transactions)

### Run the script

```sh
node index.js
```
