"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaParser = exports.getLexingResult = void 0;
const chevrotain = require("chevrotain");
const CstParser = chevrotain.CstParser;
const createToken = chevrotain.createToken;
const Lexer = chevrotain.Lexer;
const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED
});
const Comment = createToken({
    name: "Comment",
    pattern: /(\-\-.*)|(\/\*([^*]|[\r\n|\r|\n]|(\*+([^*/]|[\r\n|\r|\n])))*\*+\/)/,
    group: chevrotain.Lexer.SKIPPED
});
const SpecificComment = createToken({
    name: "SpecificComment",
    pattern: /(\'\-\-.*)/,
    group: chevrotain.Lexer.SKIPPED
});
const Identifier = createToken({ name: "Identifier", pattern: /([а-яА-ЯїЇїІіЄєa-zA-z])+([а-яА-ЯїЇїІіЄєa-zA-z\d])*/ });
const Number = createToken({ name: "Number", pattern: /\d+(\.\d+)?/ });
const String = createToken({ name: "String", pattern: /("(?:[^"\\]|\\"|\\)*")|('(?:[^'\\]|\\'|\\)*')/ });
const Variable = createToken({ name: "Variable", pattern: /(змінна)|(variable)|(переменная)|(var)/ });
const Dimension = createToken({ name: "Dimension", pattern: /(вимір)|(измерение)|(dimension)|(dim)/ });
const All = createToken({ name: "All", pattern: /(всі)|(все)|(all)/ });
const Source = createToken({ name: "Source", pattern: /(джерело)|(источник)|(source)/ });
const Instance = createToken({ name: "Instance", pattern: /(екземпляр)|(экземпляр)|(instance)/ });
const Values = createToken({ name: "Values", pattern: /(значення)|(значения)|(values)/ });
const Return = createToken({ name: "Return", pattern: /(повернути)|(возврат)|(return)/i });
const Default = createToken({ name: "Default", pattern: /(умовчання)|(умолчание)|(default)/ });
const Filter = createToken({ name: "Filter", pattern: /(фільтр)|(фильтр)|(filter)/ });
const Iif = createToken({ name: "Iif", pattern: /(iif)|(IIF)/ });
/* const ToInstance = createToken({ name: "ToInstance", pattern: /toInstance/ });
const Positive = createToken({ name: "Positive", pattern: /(POSITIVE)|(positive)/ }); */
const GreaterThanEqual = createToken({ name: "GreaterThanEqual", pattern: /(>=)|(=>)/ });
const LesserThanEqual = createToken({ name: "LesserThanEqual", pattern: /<=/ });
const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });
const LesserThan = createToken({ name: "LesserThan", pattern: /</ });
const Plus = createToken({ name: "Add", pattern: /\+/ });
const Minus = createToken({ name: "Minus", pattern: /\-/ });
const Asterisk = createToken({ name: "Asterisk", pattern: /\*/ });
const Divide = createToken({ name: "Divide", pattern: /\// });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const Assign = createToken({ name: "Assign", pattern: /=/ });
const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
const Colon = createToken({ name: "Colon", pattern: /:/ });
const Arrow = createToken({ name: "Arrow", pattern: /->/ });
const Hash = createToken({ name: "Hash", pattern: /#/ });
const NotEqual = createToken({ name: "NotEqual", pattern: /(\!=)|(\<\>)/ });
const Equal = createToken({ name: "Equal", pattern: /(==)/ });
const LeftParenthis = createToken({ name: "LeftParenthis", pattern: /\(/ });
const RightParenthis = createToken({ name: "RightParenthis", pattern: /\)/ });
var AllTokens = [
    SpecificComment,
    Comment,
    WhiteSpace,
    Variable,
    Dimension,
    All,
    Source,
    Instance,
    Values,
    Return,
    Default,
    Filter,
    Iif,
    /*  ToInstance,
     Positive, */
    String,
    Number,
    Identifier,
    NotEqual,
    Equal,
    GreaterThanEqual,
    LesserThanEqual,
    Comma,
    Assign,
    Semicolon,
    Colon,
    Arrow,
    Hash,
    LeftParenthis,
    RightParenthis,
    Plus,
    Minus,
    Asterisk,
    Divide,
    GreaterThan,
    LesserThan
];
var FormulaLexer = new Lexer(AllTokens);
function getLexingResult(input) {
    return FormulaLexer.tokenize(input);
}
exports.getLexingResult = getLexingResult;
class FormulaParser extends CstParser {
    constructor() {
        super(AllTokens);
        this.VariableDeclaration = this.RULE('VariableDeclaration', () => {
            this.CONSUME(Variable);
            this.AT_LEAST_ONE_SEP({
                SEP: Comma,
                DEF: () => {
                    this.CONSUME(Identifier);
                }
            });
            this.CONSUME(Semicolon);
        });
        this.SourceDeclaration = this.RULE('SourceDeclaration', () => {
            this.CONSUME(Source);
            this.CONSUME(Identifier);
            this.OPTION(() => this.CONSUME(Semicolon));
        });
        this.DimensionSpecifier = this.RULE('DimensionSpecifier', () => {
            this.OR1([
                {
                    ALT: () => {
                        this.OR3([
                            {
                                ALT: () => {
                                    this.CONSUME(Default);
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME(Instance);
                                }
                            },
                        ]);
                        this.OR5([
                            {
                                ALT: () => {
                                    this.CONSUME(Identifier);
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(Instance);
                                }
                            }
                        ]);
                        this.OPTION2(() => {
                            this.OR2([
                                {
                                    ALT: () => {
                                        this.SUBRULE(this.DimensionValue);
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.CONSUME1(Arrow);
                                        this.CONSUME1(Identifier);
                                    }
                                },
                            ]);
                        });
                    }
                },
                {
                    ALT: () => {
                        this.OPTION3(() => { this.CONSUME(All); });
                        this.OPTION(() => { this.CONSUME(Values); });
                    }
                },
                /* {
                    ALT: () => {
                        this.SUBRULE(this.FilterDescription)
                    }
                }, */
            ]);
        });
        this.DimensionDeclaration = this.RULE('DimensionDeclaration', () => {
            this.CONSUME(Dimension);
            this.CONSUME(Identifier);
            this.SUBRULE(this.DimensionSpecifier);
            this.CONSUME(Semicolon);
        });
        this.Dimensions = this.RULE('Dimensions', () => {
            this.AT_LEAST_ONE(() => {
                this.SUBRULE(this.DimensionDeclaration);
            });
        });
        this.DimensionValue = this.RULE('DimensionValue', () => {
            this.CONSUME(LeftParenthis);
            this.CONSUME(Filter);
            this.CONSUME(Hash);
            this.CONSUME2(Identifier);
            this.CONSUME(RightParenthis);
        });
        this.AssignStatement = this.RULE("AssignStatement", () => {
            this.CONSUME(Identifier);
            this.CONSUME(Assign);
            this.SUBRULE(this.Expression);
            this.CONSUME(Semicolon);
        });
        this.Expression = this.RULE("Expression", () => {
            this.SUBRULE(this.Operand);
            this.MANY(() => {
                this.SUBRULE(this.Operator);
                this.SUBRULE1(this.Operand);
            });
        });
        this.ParenthisExpression = this.RULE("ParenthisExpression", () => {
            this.CONSUME(LeftParenthis);
            this.SUBRULE(this.Expression);
            this.CONSUME(RightParenthis);
        });
        this.VariableReference = this.RULE('VariableReference', () => {
            this.OR([
                {
                    ALT: () => {
                        this.AT_LEAST_ONE(() => {
                            this.OR2([
                                {
                                    ALT: () => this.CONSUME(Colon)
                                },
                                {
                                    ALT: () => {
                                        this.CONSUME(Identifier);
                                        this.OPTION(() => {
                                            this.CONSUME(Arrow);
                                            this.CONSUME1(Identifier);
                                        });
                                    }
                                },
                            ]);
                            this.OPTION1(() => {
                                this.SUBRULE(this.FunctionCall);
                            });
                        });
                    }
                },
                { ALT: () => this.SUBRULE(this.FilterRefference) }
            ]);
        });
        this.OperandSimple = this.RULE("OperandSimple", () => {
            this.OR([
                {
                    ALT: () => {
                        this.SUBRULE(this.VariableReference);
                    }
                },
                { ALT: () => this.CONSUME(Number) },
                { ALT: () => this.CONSUME(String) },
                { ALT: () => this.SUBRULE(this.ParenthisExpression) },
                { ALT: () => this.SUBRULE(this.IIFExpression) }
            ]);
        });
        this.Operand = this.RULE("Operand", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.OperandSimple) },
                { ALT: () => this.SUBRULE(this.OperandWithUnary) }
            ]);
        });
        this.OperandWithUnary = this.RULE("OperandWithUnary", () => {
            this.OR([
                { ALT: () => this.CONSUME(Minus) },
            ]);
            this.SUBRULE(this.OperandSimple);
        });
        this.FunctionCall = this.RULE('FunctionCall', () => {
            this.CONSUME(LeftParenthis);
            this.OPTION(() => {
                this.SUBRULE1(this.Expression);
                this.MANY(() => {
                    this.CONSUME(Comma);
                    this.SUBRULE2(this.Expression);
                });
            });
            this.CONSUME(RightParenthis);
        });
        this.FilterRefference = this.RULE('FilterRefference', () => {
            this.CONSUME(Filter);
            this.CONSUME(Hash);
            this.CONSUME(Identifier);
        });
        this.IIFExpression = this.RULE('IIFExpression', () => {
            this.CONSUME(Iif);
            this.CONSUME(LeftParenthis);
            this.SUBRULE(this.Expression);
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(GreaterThan);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(LesserThan);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(Equal);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(NotEqual);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(GreaterThanEqual);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(LesserThanEqual);
                    }
                },
            ]);
            this.SUBRULE3(this.Expression);
            this.CONSUME1(Comma);
            this.SUBRULE1(this.Expression);
            this.CONSUME2(Comma);
            this.SUBRULE2(this.Expression);
            this.CONSUME(RightParenthis);
        });
        this.Operator = this.RULE("Operator", () => {
            this.OR([
                { ALT: () => this.CONSUME(Plus) },
                { ALT: () => this.CONSUME(Minus) },
                { ALT: () => this.CONSUME(Asterisk) },
                { ALT: () => this.CONSUME(Divide) },
            ]);
        });
        this.ReturnStatement = this.RULE("ReturnStatement", () => {
            this.CONSUME(Return);
            this.CONSUME(Identifier);
            this.CONSUME(Semicolon);
        });
        this.Program = this.RULE('Program', () => {
            this.AT_LEAST_ONE1(() => {
                this.SUBRULE(this.VariableDeclaration);
            });
            this.AT_LEAST_ONE2(() => {
                this.SUBRULE(this.SourceDeclaration);
                this.OPTION(() => this.SUBRULE(this.Dimensions));
                this.MANY(() => this.SUBRULE(this.AssignStatement));
            });
            this.SUBRULE(this.ReturnStatement);
        });
        this.performSelfAnalysis();
    }
}
exports.FormulaParser = FormulaParser;
const parserInstance = new FormulaParser();
function parseInput(text) {
    const lexingResult = FormulaLexer.tokenize(text);
    // "input" is a setter which will reset the parser's state.
    parserInstance.input = lexingResult.tokens;
}
///
const path = require("path");
const fs = require("fs");
const serializedGrammar = parserInstance.getSerializedGastProductions();
// create the HTML Text
const htmlText = chevrotain.createSyntaxDiagramsCode(serializedGrammar);
// Write the HTML file to disk
const outPath = path.resolve(__dirname, "./");
fs.writeFileSync(outPath + "/generated_diagrams.html", htmlText);
