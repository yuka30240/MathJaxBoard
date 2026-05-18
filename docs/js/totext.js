(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MathJaxBoardToText = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const COMMAND_SYMBOLS = {
        '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
        '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
        '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
        '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
        '\\pi': 'π', '\\varpi': 'ϖ', '\\rho': 'ρ', '\\varrho': 'ϱ',
        '\\sigma': 'σ', '\\varsigma': 'ς', '\\tau': 'τ', '\\upsilon': 'υ',
        '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ', '\\psi': 'ψ',
        '\\omega': 'ω', '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ',
        '\\Lambda': 'Λ', '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ',
        '\\Upsilon': 'Υ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
        '\\hbar': 'ℏ', '\\hslash': 'ℏ', '\\ell': 'ℓ', '\\aleph': 'ℵ',
        '\\imath': 'ı', '\\jmath': 'ȷ',
        '\\le': '≤', '\\leq': '≤', '\\leqq': '≦',
        '\\ge': '≥', '\\geq': '≥', '\\geqq': '≧',
        '\\neq': '≠', '\\ne': '≠', '\\approx': '≈', '\\sim': '∼',
        '\\simeq': '≃', '\\cong': '≅', '\\equiv': '≡', '\\propto': '∝',
        '\\lesssim': '≲', '\\gtrsim': '≳', '\\asymp': '≍',
        '\\doteq': '≐', '\\coloneqq': '≔',
        '\\ll': '≪', '\\gg': '≫', '\\times': '×', '\\cdot': '·',
        '\\pm': '±', '\\mp': '∓', '\\div': '÷', '\\circ': '∘',
        '\\bullet': '•', '\\star': '⋆', '\\ast': '∗', '\\oplus': '⊕',
        '\\otimes': '⊗', '\\odot': '⊙', '\\in': '∈',
        '\\notin': '∉', '\\ni': '∋', '\\subset': '⊂', '\\subseteq': '⊆',
        '\\nsubseteq': '⊈', '\\subsetneq': '⊊',
        '\\supset': '⊃', '\\supseteq': '⊇', '\\nsupseteq': '⊉',
        '\\supsetneq': '⊋', '\\cup': '∪', '\\cap': '∩',
        '\\setminus': '∖', '\\emptyset': '∅', '\\varnothing': '∅',
        '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
        '\\neg': '¬', '\\lnot': '¬', '\\land': '∧', '\\wedge': '∧',
        '\\lor': '∨', '\\vee': '∨', '\\Rightarrow': '⇒',
        '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔', '\\to': '→',
        '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
        '\\implies': '⇒', '\\impliedby': '⇐', '\\iff': '⇔',
        '\\mapsto': '↦', '\\longrightarrow': '⟶', '\\Longrightarrow': '⟹',
        '\\uparrow': '↑', '\\downarrow': '↓', '\\updownarrow': '↕',
        '\\Uparrow': '⇑', '\\Downarrow': '⇓', '\\Updownarrow': '⇕',
        '\\hookrightarrow': '↪', '\\hookleftarrow': '↩',
        '\\partial': '∂', '\\nabla': '∇', '\\int': '∫', '\\iint': '∬',
        '\\iiint': '∭', '\\iiiint': '⨌', '\\oint': '∮', '\\oiint': '∯',
        '\\sum': 'Σ', '\\prod': 'Π', '\\coprod': '∐', '\\bigcup': '⋃',
        '\\bigcap': '⋂', '\\bigvee': '⋁', '\\bigwedge': '⋀',
        '\\bigoplus': '⨁', '\\bigotimes': '⨂', '\\bigodot': '⨀',
        '\\lim': 'lim', '\\infty': '∞',
        '\\parallel': '∥', '\\nparallel': '∦', '\\perp': '⊥',
        '\\angle': '∠', '\\therefore': '∴', '\\because': '∵',
        '\\prime': '′', '\\doubleprime': '″', '\\degree': '°',
        '\\langle': '⟨', '\\rangle': '⟩', '\\lceil': '⌈',
        '\\rceil': '⌉', '\\lfloor': '⌊', '\\rfloor': '⌋',
        '\\lvert': '∣', '\\rvert': '∣', '\\lVert': '∥',
        '\\rVert': '∥', '\\vert': '∣', '\\Vert': '∥',
        '\\backslash': '\\',
        '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯',
        '\\vdots': '⋮', '\\ddots': '⋱', '\\checkmark': '✓',
        '\\dagger': '†', '\\ddagger': '‡',
        '\\_': '_', '\\%': '%', '\\{': '{', '\\}': '}'
    };

    const GREEK_UPPERCASE = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
    const GREEK_LOWERCASE = 'αβγδεζηθικλμνξοπρςστυφχψω';

    const MATH_ALPHANUMERIC_STYLE_DEFINITIONS = {
        italic: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D434 },
                { from: 'a', to: 'z', start: 0x1D44E }
            ],
            sequences: [
                { chars: GREEK_UPPERCASE, start: 0x1D6E2 },
                { chars: GREEK_LOWERCASE, start: 0x1D6FC }
            ],
            overrides: {
                h: 'ℎ'
            }
        },
        sansSerif: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D5A0 },
                { from: 'a', to: 'z', start: 0x1D5BA },
                { from: '0', to: '9', start: 0x1D7E2 }
            ]
        },
        monospace: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D670 },
                { from: 'a', to: 'z', start: 0x1D68A },
                { from: '0', to: '9', start: 0x1D7F6 }
            ]
        },
        bold: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D400 },
                { from: 'a', to: 'z', start: 0x1D41A },
                { from: '0', to: '9', start: 0x1D7CE }
            ],
            sequences: [
                { chars: GREEK_UPPERCASE, start: 0x1D6A8 },
                { chars: GREEK_LOWERCASE, start: 0x1D6C2 }
            ]
        },
        boldItalic: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D468 },
                { from: 'a', to: 'z', start: 0x1D482 }
            ],
            sequences: [
                { chars: GREEK_UPPERCASE, start: 0x1D71C },
                { chars: GREEK_LOWERCASE, start: 0x1D736 }
            ]
        },
        blackboard: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D538 },
                { from: 'a', to: 'z', start: 0x1D552 },
                { from: '0', to: '9', start: 0x1D7D8 }
            ],
            overrides: {
                C: 'ℂ',
                H: 'ℍ',
                N: 'ℕ',
                P: 'ℙ',
                Q: 'ℚ',
                R: 'ℝ',
                Z: 'ℤ'
            }
        },
        script: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D49C },
                { from: 'a', to: 'z', start: 0x1D4B6 }
            ],
            overrides: {
                B: 'ℬ',
                E: 'ℰ',
                F: 'ℱ',
                H: 'ℋ',
                I: 'ℐ',
                L: 'ℒ',
                M: 'ℳ',
                R: 'ℛ',
                e: 'ℯ',
                g: 'ℊ',
                o: 'ℴ'
            }
        },
        fraktur: {
            ranges: [
                { from: 'A', to: 'Z', start: 0x1D504 },
                { from: 'a', to: 'z', start: 0x1D51E }
            ],
            overrides: {
                C: 'ℭ',
                H: 'ℌ',
                I: 'ℑ',
                R: 'ℜ',
                Z: 'ℨ'
            }
        }
    };

    const MATH_ALPHANUMERIC_STYLES = {
        '\\mathit': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.italic,
        '\\mathsf': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.sansSerif,
        '\\mathtt': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.monospace,
        '\\mathbf': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.bold,
        '\\bm': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.boldItalic,
        '\\boldsymbol': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.boldItalic,
        '\\mathbb': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.blackboard,
        '\\mathcal': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.script,
        '\\mathfrak': MATH_ALPHANUMERIC_STYLE_DEFINITIONS.fraktur
    };

    const FUNCTIONS = new Map([
        ['\\sin', 'sin'], ['\\cos', 'cos'], ['\\tan', 'tan'],
        ['\\cot', 'cot'], ['\\sec', 'sec'], ['\\csc', 'csc'],
        ['\\arcsin', 'arcsin'], ['\\arccos', 'arccos'], ['\\arctan', 'arctan'],
        ['\\sinh', 'sinh'], ['\\cosh', 'cosh'], ['\\tanh', 'tanh'],
        ['\\log', 'log'], ['\\ln', 'ln'], ['\\exp', 'exp'],
        ['\\det', 'det'], ['\\ker', 'ker'], ['\\dim', 'dim']
    ]);

    const SPACING_COMMANDS = {
        '\\,': '',
        '\\!': '',
        '\\;': ' ',
        '\\:': ' ',
        '\\quad': ' ',
        '\\qquad': ' '
    };

    const SUPERSCRIPT = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        n: 'ⁿ', i: 'ⁱ'
    };

    const SUBSCRIPT = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ',
        l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ',
        s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ'
    };

    const STOP_ARGUMENT_COMMANDS = new Set([
        '\\le', '\\leq', '\\ge', '\\geq', '\\in', '\\subseteq'
    ]);

    const TIGHT_RIGHT_SYMBOLS = ['∂', '∇', 'Δ'];
    const TIGHT_INFIX_SYMBOLS = ['·', '⋅'];

    function latexToUnicodeText(input) {
        const parser = new Parser(String(input || ''));
        return {
            text: normalizeOutputSpacing(parser.parseSequence()),
            warnings: parser.warnings
        };
    }

    class Parser {
        constructor(input) {
            this.input = input;
            this.tokens = tokenize(input);
            this.index = 0;
            this.warnings = [];
        }

        current() {
            return this.tokens[this.index];
        }

        consume() {
            const token = this.current();
            this.index += 1;
            return token;
        }

        parseSequence(stopPredicate = null) {
            let output = '';
            while (this.current().type !== 'EOF') {
                if (stopPredicate && stopPredicate(this.current())) {
                    break;
                }
                output += this.parseItem();
            }
            return output;
        }

        parseItem() {
            const base = this.parseAtom();
            return this.applyTrailingScripts(base);
        }

        parseAtom() {
            const token = this.consume();
            switch (token.type) {
                case 'TEXT':
                case 'SPACE':
                case 'OPERATOR':
                    return token.value;
                case 'LPAREN':
                    return this.parseParen(token);
                case 'LBRACKET':
                    return this.parseBracket(token);
                case 'LBRACE':
                    return this.parseGroupContent(token);
                case 'RBRACE':
                case 'RBRACKET':
                    this.warn(`Unmatched closing delimiter: ${token.value}`);
                    return token.value;
                case 'SUP':
                case 'SUB':
                    this.warn(`Script marker ${token.value} has no base`);
                    return token.value;
                case 'COMMAND':
                    return this.parseCommand(token);
                default:
                    return '';
            }
        }

        parseParen(openToken) {
            const closeValue = openToken.value === '(' ? ')' : ']';
            const body = this.parseSequence((token) => token.type === 'RPAREN' && token.value === closeValue);
            if (this.current().type === 'RPAREN' && this.current().value === closeValue) {
                this.consume();
            } else {
                this.warn(`Missing closing ${closeValue}`);
            }
            return `${openToken.value}${body}${closeValue}`;
        }

        parseBracket(openToken) {
            const body = this.parseSequence((token) => token.type === 'RBRACKET');
            if (this.current().type === 'RBRACKET') {
                this.consume();
            } else {
                this.warn('Missing closing ]');
            }
            return `[${body}]`;
        }

        parseGroupContent() {
            const body = this.parseSequence((token) => token.type === 'RBRACE');
            if (this.current().type === 'RBRACE') {
                this.consume();
            } else {
                this.warn('Missing closing }');
            }
            return body;
        }

        parseGroupArgument() {
            if (this.current().type !== 'LBRACE') {
                return null;
            }
            this.consume();
            return this.parseGroupContent();
        }

        parseBracketArgument() {
            if (this.current().type !== 'LBRACKET') {
                return null;
            }
            this.consume();
            const body = this.parseSequence((token) => token.type === 'RBRACKET');
            if (this.current().type === 'RBRACKET') {
                this.consume();
            } else {
                this.warn('Missing closing ]');
            }
            return body;
        }

        parseCommand(token) {
            const command = token.value;

            if (Object.prototype.hasOwnProperty.call(SPACING_COMMANDS, command)) {
                return SPACING_COMMANDS[command];
            }
            if (command === '\\left' || command === '\\right') {
                return this.parseLeftRightDelimiter();
            }
            if (command === '\\not') {
                return this.parseNotCommand(token);
            }
            if (command === '\\sqrt') {
                return this.parseSqrt();
            }
            if (command === '\\frac') {
                return this.parseFrac();
            }
            if (Object.prototype.hasOwnProperty.call(MATH_ALPHANUMERIC_STYLES, command)) {
                return this.parseMathAlphanumeric(command);
            }
            if (command === '\\operatorname') {
                return this.parseOperatorName();
            }
            if (command === '\\mathrm') {
                return this.parseGroupArgument() || '';
            }
            if (command === '\\begin') {
                return this.parseEnvironment(token);
            }
            if (command === '\\newcommand' || command === '\\def' || command === '\\let') {
                this.warn(`Unsupported macro command: ${command}`);
                return command;
            }
            if (FUNCTIONS.has(command)) {
                return this.parseFunction(FUNCTIONS.get(command));
            }
            if (Object.prototype.hasOwnProperty.call(COMMAND_SYMBOLS, command)) {
                return COMMAND_SYMBOLS[command];
            }

            this.warn(`Unsupported command: ${command}`);
            return this.preserveUnsupportedCommand(token);
        }

        parseNotCommand(token) {
            const startIndex = this.index;
            while (this.current().type === 'SPACE') {
                this.consume();
            }

            if (this.current().type === 'COMMAND' && this.current().value === '\\in') {
                this.consume();
                return '∉';
            }

            this.index = startIndex;
            this.warn(`Unsupported command: ${token.value}`);
            return token.value;
        }

        parseLeftRightDelimiter() {
            const token = this.current();
            if (token.type === 'COMMAND' && (token.value === '\\{' || token.value === '\\}')) {
                this.consume();
                return COMMAND_SYMBOLS[token.value];
            }
            if (token.type === 'LPAREN' || token.type === 'RPAREN' || token.type === 'LBRACKET' || token.type === 'RBRACKET') {
                this.consume();
                return token.value;
            }
            if (token.type === 'OPERATOR' && token.value === '.') {
                this.consume();
                return '';
            }
            return '';
        }

        parseSqrt() {
            const rootIndex = this.parseBracketArgument();
            const body = this.parseGroupArgument();
            const convertedBody = body === null ? this.parseScriptArg() : body;

            if (rootIndex === null) {
                return `√(${convertedBody})`;
            }
            if (rootIndex === '3') {
                return `∛(${convertedBody})`;
            }
            if (rootIndex === '4') {
                return `∜(${convertedBody})`;
            }
            return `root${formatSubscript(rootIndex)}(${convertedBody})`;
        }

        parseFrac() {
            const numerator = this.parseGroupArgument();
            const denominator = this.parseGroupArgument();
            const safeNumerator = numerator === null ? '' : numerator;
            const safeDenominator = denominator === null ? '' : denominator;
            return `${wrapFractionPart(safeNumerator)}/${wrapFractionPart(safeDenominator)}`;
        }

        parseMathAlphanumeric(command) {
            const value = this.parseGroupArgument();
            if (!value) return '';
            return convertMathAlphanumeric(value, MATH_ALPHANUMERIC_STYLES[command]);
        }

        parseOperatorName() {
            const name = this.parseGroupArgument() || '';
            return this.parseNamedOperator(name);
        }

        parseNamedOperator(name) {
            if (!name) return '';
            const arg = this.readFunctionArgument();
            if (!arg) return name;
            return `${name}${formatFunctionArgument(arg)}`;
        }

        parseFunction(name) {
            const scripts = this.consumeScripts();
            const decoratedName = formatScripts(name, scripts.sup, scripts.sub);
            const arg = this.readFunctionArgument();
            if (!arg) {
                return decoratedName;
            }
            return `${decoratedName}${formatFunctionArgument(arg)}`;
        }

        parseEnvironment(beginToken) {
            const envStartIndex = this.index;
            const envName = this.parseRawBraceArgument();
            if (!envName) {
                this.warn('Unsupported environment with missing name');
                return '\\begin';
            }

            const endPattern = `\\end{${envName}}`;
            const contentStart = this.tokens[envStartIndex].start;
            const rawSearchStart = this.current().start;
            const endIndex = this.input.indexOf(endPattern, rawSearchStart);

            this.warn(`Unsupported environment: ${envName}`);
            if (endIndex === -1) {
                this.index = this.tokens.length - 1;
                return this.input.slice(beginToken.start);
            }

            const rawEnd = endIndex + endPattern.length;
            while (this.current().type !== 'EOF' && this.current().end <= rawEnd) {
                this.consume();
            }
            return `\\begin{${envName}}${this.input.slice(rawSearchStart, rawEnd)}`;
        }

        parseRawBraceArgument() {
            if (this.current().type !== 'LBRACE') {
                return null;
            }
            this.consume();
            let raw = '';
            while (this.current().type !== 'EOF' && this.current().type !== 'RBRACE') {
                raw += this.consume().value;
            }
            if (this.current().type === 'RBRACE') {
                this.consume();
            } else {
                this.warn('Missing closing }');
            }
            return raw;
        }

        preserveUnsupportedCommand(token) {
            let raw = token.value;
            if (this.current().type === 'LBRACE') {
                const start = this.current().start;
                let depth = 0;
                while (this.current().type !== 'EOF') {
                    const current = this.consume();
                    if (current.type === 'LBRACE') depth += 1;
                    if (current.type === 'RBRACE') {
                        depth -= 1;
                        if (depth === 0) {
                            raw += this.input.slice(start, current.end);
                            return raw;
                        }
                    }
                }
                this.warn('Missing closing }');
                raw += this.input.slice(start);
            }
            return raw;
        }

        applyTrailingScripts(base) {
            const scripts = this.consumeScripts();
            if (!scripts.sup && !scripts.sub) {
                return base;
            }
            return formatScripts(base, scripts.sup, scripts.sub);
        }

        consumeScripts() {
            let sup = null;
            let sub = null;
            while (this.current().type === 'SUP' || this.current().type === 'SUB') {
                const type = this.consume().type;
                const value = this.parseScriptArg();
                if (type === 'SUP') {
                    sup = value;
                } else {
                    sub = value;
                }
            }
            return { sup, sub };
        }

        parseScriptArg() {
            if (this.current().type === 'EOF') {
                this.warn('Missing script argument');
                return '';
            }
            if (this.current().type === 'LBRACE') {
                this.consume();
                return this.parseGroupContent();
            }
            return this.parseAtom();
        }

        readFunctionArgument() {
            this.consumeInlineSpaces();
            const token = this.current();
            if (isFunctionArgumentStop(token)) {
                return '';
            }

            if (token.type === 'LBRACE') {
                this.consume();
                return this.parseGroupContent();
            }
            if (token.type === 'LPAREN') {
                this.consume();
                const closeValue = token.value === '(' ? ')' : ']';
                const body = this.parseSequence((candidate) => candidate.type === 'RPAREN' && candidate.value === closeValue);
                if (this.current().type === 'RPAREN' && this.current().value === closeValue) {
                    this.consume();
                } else {
                    this.warn(`Missing closing ${closeValue}`);
                }
                return { text: body, wrapped: true };
            }

            const base = this.parseAtom();
            return this.applyTrailingScripts(base);
        }

        consumeInlineSpaces() {
            while (this.current().type === 'SPACE') {
                this.consume();
            }
        }

        warn(message) {
            this.warnings.push(message);
        }
    }

    function tokenize(input) {
        const tokens = [];
        let index = 0;
        while (index < input.length) {
            const start = index;
            const char = input[index];

            if (char === '\\') {
                index += 1;
                if (/[A-Za-z]/.test(input[index] || '')) {
                    while (/[A-Za-z]/.test(input[index] || '')) {
                        index += 1;
                    }
                } else if (index < input.length) {
                    index += 1;
                }
                tokens.push({ type: 'COMMAND', value: input.slice(start, index), start, end: index });
                continue;
            }

            if (/\s/.test(char)) {
                index += 1;
                while (/\s/.test(input[index] || '')) {
                    index += 1;
                }
                tokens.push({ type: 'SPACE', value: ' ', start, end: index });
                continue;
            }

            const singleType = {
                '{': 'LBRACE',
                '}': 'RBRACE',
                '^': 'SUP',
                '_': 'SUB',
                '(': 'LPAREN',
                ')': 'RPAREN',
                '[': 'LBRACKET',
                ']': 'RBRACKET'
            }[char];
            if (singleType) {
                index += 1;
                tokens.push({ type: singleType, value: char, start, end: index });
                continue;
            }

            if ('+-=/*,;:|<>!&.'.includes(char)) {
                index += 1;
                tokens.push({ type: 'OPERATOR', value: char, start, end: index });
                continue;
            }

            index += 1;
            while (
                index < input.length
                && !/[\\\s{}^_()[\]+\-=/\*,;:|<>!&.]/.test(input[index])
            ) {
                index += 1;
            }
            tokens.push({ type: 'TEXT', value: input.slice(start, index), start, end: index });
        }
        tokens.push({ type: 'EOF', value: '', start: input.length, end: input.length });
        return tokens;
    }

    function isFunctionArgumentStop(token) {
        if (!token || token.type === 'EOF') return true;
        if (token.type === 'OPERATOR' && '+-=,;:<>'.includes(token.value)) return true;
        if (token.type === 'RBRACE' || token.type === 'RBRACKET' || token.type === 'RPAREN') return true;
        return token.type === 'COMMAND' && STOP_ARGUMENT_COMMANDS.has(token.value);
    }

    function formatFunctionArgument(arg) {
        if (typeof arg === 'object' && arg.wrapped) {
            return `(${arg.text})`;
        }
        return `(${arg})`;
    }

    function formatScripts(base, sup, sub) {
        if (isLargeOperator(base) && (sup || sub)) {
            const rangeSup = sup ? sup.replace(/\s+/g, '') : sup;
            const rangeSub = sub ? sub.replace(/\s+/g, '') : sub;
            if (sup && sub) {
                return `${base}_{${rangeSub}..${rangeSup}}`;
            }
            if (sup) {
                return `${base}^{${rangeSup}}`;
            }
            return `${base}_{${rangeSub}}`;
        }

        let output = base;
        if (sub) {
            output += formatSubscript(sub);
        }
        if (sup) {
            output += formatSuperscript(sup);
        }
        return output;
    }

    function isLargeOperator(base) {
        return base === 'Σ' || base === 'Π' || base === '∫' || base === 'lim';
    }

    function formatSuperscript(value) {
        return formatScriptValue(value, SUPERSCRIPT, '^');
    }

    function formatSubscript(value) {
        return formatScriptValue(value, SUBSCRIPT, '_');
    }

    function formatScriptValue(value, table, marker) {
        if (!value) return `${marker}()`;
        if (canUseUnicodeScript(value, table, marker)) {
            return Array.from(value).map((char) => table[char]).join('');
        }
        return `${marker}(${value})`;
    }

    function canUseUnicodeScript(value, table, marker) {
        if (!Array.from(value).every((char) => Object.prototype.hasOwnProperty.call(table, char))) {
            return false;
        }
        if (marker === '_' && /[A-Za-z].*[A-Za-z]/.test(value)) {
            return false;
        }
        if (marker === '^' && /[A-Za-z].*[A-Za-z]/.test(value)) {
            return false;
        }
        if (/[A-Za-z]/.test(value) && /[+\-=()]/.test(value)) {
            return false;
        }
        return true;
    }

    function convertMathAlphanumeric(value, style) {
        return Array.from(value).map((char) => convertMathAlphanumericChar(char, style)).join('');
    }

    function convertMathAlphanumericChar(char, style) {
        const overrides = style.overrides || {};
        if (Object.prototype.hasOwnProperty.call(overrides, char)) {
            return overrides[char];
        }

        const codePoint = char.codePointAt(0);
        for (const range of style.ranges || []) {
            const from = range.from.codePointAt(0);
            const to = range.to.codePointAt(0);
            if (from <= codePoint && codePoint <= to) {
                return String.fromCodePoint(range.start + codePoint - from);
            }
        }

        for (const sequence of style.sequences || []) {
            const index = Array.from(sequence.chars).indexOf(char);
            if (index !== -1) {
                return String.fromCodePoint(sequence.start + index);
            }
        }
        return char;
    }

    function wrapFractionPart(value) {
        if (isSimpleFractionPart(value)) {
            return value;
        }
        return `(${value})`;
    }

    function isSimpleFractionPart(value) {
        if (/^∂[A-Za-zΑ-Ωα-ω]/.test(value)) {
            return false;
        }
        return /^[A-Za-z0-9α-ωΑ-Ωℕℤℚℝℂ𝔽ℏℓℵ∞∂∇]+[\u00B2\u00B3\u00B9\u2070-\u207F\u2080-\u209C]*$/.test(value);
    }

    function normalizeOutputSpacing(value) {
        return normalizeTightSymbolSpaces(value.replace(/\s+/g, ' ').trim());
    }

    function normalizeTightSymbolSpaces(value) {
        const rightSymbols = TIGHT_RIGHT_SYMBOLS.map(escapeRegExp).join('');
        const infixSymbols = TIGHT_INFIX_SYMBOLS.map(escapeRegExp).join('');
        return value
            .replace(new RegExp(`([${rightSymbols}])\\s+`, 'g'), '$1')
            .replace(new RegExp(`\\s*([${infixSymbols}])\\s*`, 'g'), '$1');
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    return {
        latexToUnicodeText,
        tokenize
    };
});
