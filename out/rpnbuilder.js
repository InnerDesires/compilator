"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExressions = void 0;
// @ts-nocheck
const prompt = require("prompt-sync")({ sigint: true });
const priorityDict = {
    '#IIF': {
        priority: 1,
        orientation: 'left'
    },
    '!': {
        priority: 11,
        orientation: 'left'
    },
    '~': {
        priority: 11,
        orientation: 'left'
    },
    '*': {
        priority: 10,
        orientation: 'left'
    },
    '/': {
        priority: 10,
        orientation: 'left'
    },
    '+': {
        priority: 5,
        orientation: 'left'
    },
    '-': {
        priority: 5,
        orientation: 'left'
    },
    '==': {
        priority: 3,
        orientation: 'left'
    },
    '<': {
        priority: 4,
        orientation: 'left'
    },
    '>': {
        priority: 4,
        orientation: 'left'
    },
    '^': {
        priority: 11,
        orientation: 'right'
    },
    '||': {
        priority: 3,
        orientation: 'left'
    },
    '&&': {
        priority: 3,
        orientation: 'left'
    },
};
function expressionParser(expression, _builder) {
    if (typeof _builder === 'string') {
        var rawString = _builder;
        let builder = new PolisBuilder(rawString);
        traverseExpression(builder);
        return builder.end();
    }
    else if (_builder.constructor.name == 'PolisBuilder') {
        traverseExpression(_builder);
    }
    function traverseExpression(builder) {
        operandParser(expression.children.Operand[0], builder);
        for (let i = 1; i < expression.children.Operand.length; i++) {
            operatorParser(expression.children.Operator[i - 1], builder);
            operandParser(expression.children.Operand[i], builder);
        }
    }
}
function operandParser(operand, builder) {
    let operandType = Object.keys(operand.children)[0];
    if (operandType === 'OperandWithUnary') {
        operandWithUnaryParser(operand.children.OperandWithUnary[0], builder);
    }
    else if (operandType === "OperandSimple") {
        operandSimpleParser(operand.children.OperandSimple[0], builder);
    }
}
function operandSimpleParser(operand, builder) {
    let operandType = Object.keys(operand.children)[0];
    if (operandType === "ParenthisExpression") {
        parenthisExpressionParser(operand.children[operandType][0], builder);
        return;
    }
    if (operandType === "VariableReference") {
        let varRef = operand.children['VariableReference'][0];
        if (varRef.children['FunctionCall']) {
            var functionName = varRef.children['Identifier'][0].image;
            var functionCall = varRef.children['FunctionCall'][0];
            functionCall.children["Expression"].forEach(expression => {
                builder.next({ type: "leftBracket", str: '(' });
                expressionParser(expression, builder);
                builder.next({ type: "rightBracket", str: ')' });
            });
            builder.outputQueue.push(`#${functionName}`);
            return;
        }
        builder.next({ type: "operand", str: builder.rawString.slice(operand.location.startOffset, operand.location.endOffset + 1) });
        return;
    }
    if (operandType === "Number") {
        builder.next({ type: "operand", str: operand.children["Number"][0].image });
        return;
    }
    if (operandType === "IIFExpression") {
        builder.next({ type: "leftBracket", str: '(' });
        var iif = operand.children["IIFExpression"][0];
        expressionParser(iif.children["Expression"][0], builder);
        expressionParser(iif.children["Expression"][1], builder);
        let compareOperator = iif.children["GreaterThan"] ||
            iif.children["LesserThan"] ||
            iif.children["Equal"] ||
            iif.children["NotEqual"] ||
            iif.children["GreaterThanEqual"] ||
            iif.children["LesserThanEqual"];
        builder.outputQueue.push(compareOperator[0].image);
        expressionParser(iif.children["Expression"][2], builder);
        expressionParser(iif.children["Expression"][3], builder);
        builder.next({ type: "rightBracket", str: ')' });
        builder.next({ type: "operator", str: "#IIF" });
        return;
    }
}
function operatorParser(operator, builder) {
    let operatorType = Object.keys(operator.children)[0];
    builder.next({ type: 'operator', str: operator.children[operatorType][0].image });
}
function operandWithUnaryParser(operand, builder) {
    operandSimpleParser(operand.children['OperandSimple'][0], builder);
    if (operand.children['Not']) {
        builder.next({ type: 'operator', str: '!' });
    }
    if (operand.children['Minus']) {
        builder.next({ type: 'operator', str: '~' });
    }
}
function parenthisExpressionParser(expression, builder) {
    builder.next({ type: "leftBracket", str: '(' });
    expressionParser(expression.children['Expression'][0], builder);
    builder.next({ type: "rightBracket", str: ')' });
}
class PolisBuilder {
    constructor(rawString) {
        this.rawString = rawString;
        this.operatorStack = [];
        this.outputQueue = [];
    }
    next(token) {
        switch (token.type) {
            case "operator":
                while (this.operatorStack.length > 0 && this.operatorStack[this.operatorStack.length - 1] !== '(' &&
                    (priorityDict[this.operatorStack[this.operatorStack.length - 1]].priority > priorityDict[token.str].priority ||
                        (priorityDict[this.operatorStack[this.operatorStack.length - 1]].priority === priorityDict[token.str].priority && priorityDict[token.str].orientation === 'left'))) {
                    this.outputQueue.push(this.operatorStack.pop());
                }
                this.operatorStack.push(token.str);
                break;
            case "operand":
                this.outputQueue.push(token.str);
                break;
            case "leftBracket":
                this.operatorStack.push(token.str);
                break;
            case "rightBracket":
                while (this.operatorStack[this.operatorStack.length - 1] !== "(") {
                    this.outputQueue.push(this.operatorStack.pop());
                }
                this.operatorStack.pop();
                break;
        }
    }
    end() {
        while (this.operatorStack.length !== 0)
            this.outputQueue.push(this.operatorStack.pop());
        return this.outputQueue;
    }
}
function parseExpression(expression) {
    var res = expressionParser(expression);
    return res;
}
function variableRefferenceToImage(varREf) {
}
function parseExressions(cst, rawString) {
    let assignStatements = [];
    cst.children.SourceBlock.forEach((sourceBlock, SBIndex) => {
        assignStatements.push([]);
        sourceBlock.children.AssignStatement.forEach((statement) => {
            assignStatements[SBIndex].push(statement.children);
        });
    });
    assignStatements.forEach(sb => {
        sb.forEach(statement => {
            let expression = statement.Expression[0];
            let res = expressionParser(expression, rawString);
            statement.parsingResult = res;
        });
    });
    return assignStatements;
}
exports.parseExressions = parseExressions;
