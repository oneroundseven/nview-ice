// Copyright 2017 FOCUS Inc.All Rights Reserved.

/**
 * @fileOverview koa-ice
 * @author oneroundseven@gmail.com
 */

const pino = require('pino');
const fs = require('fs');
const util = require('../util');
const setting = require('../setting');

/**
 * server: 启动日志
 * visiting: 接口访问日志
 * error: 错误及警告日志
 */
const LOG_TYPE = ['server', 'visiting', 'error'];
let noop = function() {};
let logName = 'koa-ice';

let pretty = pino.pretty({
    crlf: true,
    formatter: (ori, preFunction)=> {
        let line = '[';
        line += util.formatDate('yyyy-MM-dd hh:mm:ss') + '] ';
        line += preFunction.asColoredLevel(ori) + ' ';
        line += preFunction.chalk.cyan(ori.msg);

        return line;
    }
});

const consoleAppender = pino({
    name: logName,
    safe: true,
}, pretty.pipe(process.stdout));

let logPath = process.cwd() + setting.logPath;
let loggerAppender = {
    visiting: noop,
    error: noop,
    server: noop
};

// create path
if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath);
}

// create log files and init loggerAppender
LOG_TYPE.map((item, index)=> {
    if (!fs.existsSync(logPath + '/' + item + '.log')) {
        fs.openSync(logPath + '/' + item + '.log', 'w');
    }

    loggerAppender[item] = pino({
        name: logName,
        safe: true
    }, pretty.pipe(fs.createWriteStream(logPath + '/' + item +'.log')))[item === 'error' ? 'error' : 'info'];
});


let mode = global.mode;

module.exports = {
    /**
     * info log
     * @param msg
     * @param type [compile]  compile write to server start log
     */
    info: (msg, type)=> {
        if (mode === 'dev') {
            consoleAppender.info(msg);
        }

        if (type === 'compile') {
            loggerAppender.server(msg);
        } else {
            loggerAppender.visiting(msg);
        }
    },
    error: (msg)=> {
        if (mode === 'dev') {
            consoleAppender.error(msg);
        }

        loggerAppender.error(msg);
    },
    warn: (msg)=> {
        if (mode === 'dev') {
            consoleAppender.warn(msg);
        }

        loggerAppender.warn(msg);
    }
};
