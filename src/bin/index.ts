#!/usr/bin/env node

import { parseArguments } from '../services/cli.service';
import * as process from 'node:process';

const res = parseArguments(process.argv);
console.log(res);
console.log(res.config);
