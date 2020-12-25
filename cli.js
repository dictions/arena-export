#!/usr/bin/env node

const sade = require('sade');
const nodePackage = require('./package.json');

const prog = sade('arena-export');

prog.version(nodePackage.version).option(
	'-c, --config',
	'Provide path to custom config',
	'foo.config.js',
);

prog.parse(process.argv);
