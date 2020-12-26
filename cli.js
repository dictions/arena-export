#!/usr/bin/env node

const sade = require('sade');
const nodePackage = require('./package.json');
const exportChannels = require('./src/exportChannels');

const prog = sade('arena-export');

prog.version(nodePackage.version);

prog.command('export:user:channels <userId> <outFileGlob>')
	.option('-t, --token', 'Set your access token for Are.na')
	.example('export:user:channels 123 channel.json -t 123')
	.action(exportChannels);

prog.parse(process.argv);
