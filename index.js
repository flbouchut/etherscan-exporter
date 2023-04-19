import axios from "axios";
import fs from "fs";
import { Parser } from "@json2csv/plainjs";
import * as dotenv from "dotenv";

dotenv.config();

// Address to extract the data from
const address = "0x4D9fF50EF4dA947364BB9650892B2554e7BE5E2B";

// First block of the extract, below it corresponds to 01-01-2022, 00:00:00 CEST
const startblock = "13915898";

// Last block of the extract, below it corresponds to 31-12-2022, 23:59:59 CEST
const endblock = "16307890";

// The number of transactions to retrieve by API call. It is limited to 10 000 by Etherscan
const offset = "10000";

// Etherscan API KEY
const API_KEY = process.env.API_KEY;

const getResponseFromApi = async (address, startblock, endblock) => {
    const response = await axios.get(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startblock}&endblock=${endblock}&page=1&offset=${offset}&sort=asc&apikey=${API_KEY}`
    );
    return response.data;
};

const main = async () => {
    try {
        const data = await getResponseFromApi(address, startblock, endblock);
        const result = data.result;

        // Need an intermediate last block to iterate on it because etherscan API calls are restricted to 10k responses
        let intermediateLastBlock = Number(
            result[result.length - 1].blockNumber
        );

        // Need to delete transactions of last block because it might be incomplete
        let i = 0;
        let includedTxForLastBlock = [];
        while (
            result[result.length - 1 - i].blockNumber == intermediateLastBlock
        ) {
            includedTxForLastBlock.push(result[result.length - 1 - i]);
            i++;
        }
        let numberOfLinesToRemove = includedTxForLastBlock.length;

        for (let i = 0; i < numberOfLinesToRemove; i++) {
            result.pop();
        }

        // Parse the CSV file
        const parser = new Parser();
        let csv = parser.parse(result);
        csv += "\n";

        // Create the file by keeping the headers
        fs.writeFile("output.csv", csv, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("File created successfully");
            }
        });

        // Get remaining data by batch of 10 000 (offset)
        while (intermediateLastBlock < endblock && result.length != 0) {
            console.log(
                `A merge of the extracts occured between at block ${intermediateLastBlock}. Please check that no transaction was missed by looking at nonces`
            );

            const data = await getResponseFromApi(
                address,
                intermediateLastBlock,
                endblock
            );

            let result = data.result;

            let isLastIteration = false;
            if (result.length != Number(offset)) {
                isLastIteration = true;
            }

            // If Etherscan returns an empty array then we don't have anymore data to retrieve
            if (result.length == 0) {
                throw new Error(
                    "No more data to retrieve. Don't worry execution ended well."
                );
            }

            intermediateLastBlock = Number(
                result[result.length - 1].blockNumber
            );

            // Need to delete transactions of last block because it might be incomplete unless it is the last transaction(s)
            if (!isLastIteration) {
                let i = 0;
                let includedTxForLastBlock = [];
                while (
                    result[result.length - 1 - i].blockNumber ==
                    intermediateLastBlock
                ) {
                    includedTxForLastBlock.push(result[result.length - 1 - i]);
                    i++;
                }
                let numberOfLinesToRemove = includedTxForLastBlock.length;

                for (let i = 0; i < numberOfLinesToRemove; i++) {
                    result.pop();
                }
            }

            // Parse to csv
            let csv = parser.parse(result);

            // Remove header because already inside the file
            let csvWithoutHeader = csv.substring(
                csv.indexOf("\n") + 1,
                csv.length
            );

            csvWithoutHeader += "\n";

            fs.appendFile("output.csv", csvWithoutHeader, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(
                        `File written successfully by adding ${result.length} lines`
                    );
                }
            });

            // Exit the program because no more data to retrieve
            if (isLastIteration) {
                throw new Error(
                    "No more data to retrieve. Don't worry execution ended well."
                );
            }
        }
    } catch (err) {
        console.log("An error has been caught : ", err);
    }
};

main();
