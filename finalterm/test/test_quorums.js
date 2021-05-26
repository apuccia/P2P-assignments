const assert = require("chai").assert;

const Mayor = artifacts.require("Mayor");
const MayorFactory = artifacts.require("MayorFactory");

const fs = require('fs');
const myConsole = new console.Console(fs.createWriteStream('./output_quorums.txt'));

contract("MayorTest", accounts => {
    describe("Test consumed gas with quorum of 25 voters", function() {
        it("", async function () {
            var sigils = [];
            var doblons = [];
            var souls = [];
            var envelopes = [];
            var receipt;
            var totalGasUsed = BigInt(0);
            var gasUsed;

            myConsole.log("---------GAS USED FOR 25 VOTERS QUORUM---------");

            const mayor = await Mayor.new(accounts[0], accounts[100], 25);
            const mayorFactory = await MayorFactory.new();

            gasUsed = await mayorFactory.create_instance.estimateGas(accounts[0], accounts[100], 25);
            myConsole.log("[constructor] Gas used: " + gasUsed + "\n");

            totalGasUsed += BigInt(gasUsed);

            for (var i = 0; i < 25; i++) {
                sigils[i] = Math.floor(Math.random() * 10000);
                doblons[i] = Math.random() < 0.5;
                souls[i] = Math.floor(Math.random() * 10000);
                
                gasUsed = await mayor.compute_envelope.estimateGas(sigils[i], doblons[i], souls[i]);
                envelopes[i] = await mayor.compute_envelope(sigils[i], doblons[i], souls[i]);

                totalGasUsed += BigInt(gasUsed);

                myConsole.log("[compute_envelope] Gas used: " + gasUsed);

                receipt = await mayor.cast_envelope(envelopes[i], {from: accounts[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[cast_envelope] Gas used: " + gasUsed);
            }

            for (var i = 0; i < 25; i++) {
                receipt = await mayor.open_envelope(sigils[i], doblons[i], {from: accounts[i], value: souls[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[open_envelope] Gas used: " + gasUsed);
            }

            receipt = await mayor.mayor_or_sayonara({from: accounts[0]});

            gasUsed = BigInt(receipt.receipt.gasUsed);

            totalGasUsed += gasUsed;
            myConsole.log("[mayor_or_sayonara] Gas used: " + gasUsed + "\n");

            myConsole.log("All gas used: " + totalGasUsed);
        });
    });

    describe("Test consumed gas with quorum of 50 voters", function() {
        it("", async function () {
            var sigils = [];
            var doblons = [];
            var souls = [];
            var envelopes = [];
            var receipt;
            var totalGasUsed = BigInt(0);
            var gasUsed;

            myConsole.log("---------GAS USED FOR 50 VOTERS QUORUM---------");

            const mayor = await Mayor.new(accounts[0], accounts[100], 50);
            const mayorFactory = await MayorFactory.new();

            gasUsed = await mayorFactory.create_instance.estimateGas(accounts[0], accounts[100], 50);
            myConsole.log("[constructor] Gas used: " + gasUsed + "\n");

            totalGasUsed += BigInt(gasUsed);

            for (var i = 0; i < 50; i++) {
                sigils[i] = Math.floor(Math.random() * 10000);
                doblons[i] = Math.random() < 0.5;
                souls[i] = Math.floor(Math.random() * 10000);
                
                gasUsed = await mayor.compute_envelope.estimateGas(sigils[i], doblons[i], souls[i]);
                envelopes[i] = await mayor.compute_envelope(sigils[i], doblons[i], souls[i]);

                totalGasUsed += BigInt(gasUsed);

                myConsole.log("[compute_envelope] Gas used: " + gasUsed);

                receipt = await mayor.cast_envelope(envelopes[i], {from: accounts[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[cast_envelope] Gas used: " + gasUsed);
            }

            for (var i = 0; i < 50; i++) {
                receipt = await mayor.open_envelope(sigils[i], doblons[i], {from: accounts[i], value: souls[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[open_envelope] Gas used: " + gasUsed);
            }

            receipt = await mayor.mayor_or_sayonara({from: accounts[0]});

            gasUsed = BigInt(receipt.receipt.gasUsed);

            totalGasUsed += gasUsed;
            myConsole.log("[mayor_or_sayonara] Gas used: " + gasUsed + "\n");

            myConsole.log("All gas used: " + totalGasUsed);
        });
    });

    describe("Test consumed gas with quorum of 75 voters", function() {
        it("", async function () {
            var sigils = [];
            var doblons = [];
            var souls = [];
            var envelopes = [];
            var receipt;
            var totalGasUsed = BigInt(0);
            var gasUsed;

            myConsole.log("---------GAS USED FOR 75 VOTERS QUORUM---------");

            const mayor = await Mayor.new(accounts[0], accounts[100], 75);
            const mayorFactory = await MayorFactory.new();

            gasUsed = await mayorFactory.create_instance.estimateGas(accounts[0], accounts[100], 75);
            myConsole.log("[constructor] Gas used: " + gasUsed + "\n");

            totalGasUsed += BigInt(gasUsed);

            for (var i = 0; i < 75; i++) {
                sigils[i] = Math.floor(Math.random() * 10000);
                doblons[i] = Math.random() < 0.5;
                souls[i] = Math.floor(Math.random() * 10000);
                
                gasUsed = await mayor.compute_envelope.estimateGas(sigils[i], doblons[i], souls[i]);
                envelopes[i] = await mayor.compute_envelope(sigils[i], doblons[i], souls[i]);

                totalGasUsed += BigInt(gasUsed);

                myConsole.log("[compute_envelope] Gas used: " + gasUsed);

                receipt = await mayor.cast_envelope(envelopes[i], {from: accounts[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[cast_envelope] Gas used: " + gasUsed);
            }

            for (var i = 0; i < 75; i++) {
                receipt = await mayor.open_envelope(sigils[i], doblons[i], {from: accounts[i], value: souls[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[open_envelope] Gas used: " + gasUsed);
            }

            receipt = await mayor.mayor_or_sayonara({from: accounts[0]});

            gasUsed = BigInt(receipt.receipt.gasUsed);

            totalGasUsed += gasUsed;
            myConsole.log("[mayor_or_sayonara] Gas used: " + gasUsed + "\n");

            myConsole.log("All gas used: " + totalGasUsed);
        });
    });

    describe("Test consumed gas with quorum of 100 voters", function() {
        it("", async function () {
            var sigils = [];
            var doblons = [];
            var souls = [];
            var envelopes = [];
            var receipt;
            var totalGasUsed = BigInt(0);
            var gasUsed;

            myConsole.log("---------GAS USED FOR 100 VOTERS QUORUM---------");

            const mayor = await Mayor.new(accounts[0], accounts[100], 100);
            const mayorFactory = await MayorFactory.new();

            gasUsed = await mayorFactory.create_instance.estimateGas(accounts[0], accounts[100], 100);
            myConsole.log("[constructor] Gas used: " + gasUsed + "\n");

            totalGasUsed += BigInt(gasUsed);

            for (var i = 0; i < 100; i++) {
                sigils[i] = Math.floor(Math.random() * 10000);
                doblons[i] = Math.random() < 0.5;
                souls[i] = Math.floor(Math.random() * 10000);
                
                gasUsed = await mayor.compute_envelope.estimateGas(sigils[i], doblons[i], souls[i]);
                envelopes[i] = await mayor.compute_envelope(sigils[i], doblons[i], souls[i]);

                totalGasUsed += BigInt(gasUsed);

                myConsole.log("[compute_envelope] Gas used: " + gasUsed);

                receipt = await mayor.cast_envelope(envelopes[i], {from: accounts[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[cast_envelope] Gas used: " + gasUsed);
            }

            for (var i = 0; i < 100; i++) {
                receipt = await mayor.open_envelope(sigils[i], doblons[i], {from: accounts[i], value: souls[i]});

                gasUsed = BigInt(receipt.receipt.gasUsed);

                totalGasUsed += gasUsed;
                myConsole.log("[open_envelope] Gas used: " + gasUsed);
            }

            receipt = await mayor.mayor_or_sayonara({from: accounts[0]});

            gasUsed = BigInt(receipt.receipt.gasUsed);

            totalGasUsed += gasUsed;
            myConsole.log("[mayor_or_sayonara] Gas used: " + gasUsed + "\n");

            myConsole.log("All gas used: " + totalGasUsed);
        });
    });
});