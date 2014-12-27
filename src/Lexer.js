var Lexer = exports.Lexer = function (input) {
	var token, label;

	function match(re) {
		var result = re.exec(input);
		if (result) {
			label = result[0];
			input = input.substr(label.length);
			return true;
		} else {
			return false;
		}
	}

	function next() {
		if (match(/^(\s|(#.*\n))+/)) {
			return next();
		} else if (match(/^(null|undefined|true|false|not|and|or|xor|fix|this|new|bool|unknown|int|float|complex|string|regex|let|in|if|then|else|throw|try|catch|finally|error|throws)\b/)) {
			return token = 'keyword:' + label;
		} else if (match(/^[A-Za-z_\$][A-Za-z0-9_\$]*\b/)) {
			return token = 'identifier';
		} else if (match(/^\-\>/)) {
			return token = 'arrow';
		} else if (match(/^\=\>/)) {
			return token = 'fat-arrow';
		} else if (match(/^\,/)) {
			return token = 'comma';
		} else if (match(/^\./)) {
			return token = 'point';
		} else if (match(/^\:/)) {
			return token = 'colon';
		} else if (match(/^\(/)) {
			return token = 'left';
		} else if (match(/^\)/)) {
			return token = 'right';
		} else if (match(/^\[/)) {
			return token = 'left-square';
		} else if (match(/^\]/)) {
			return token = 'right-square';
		} else if (match(/^(0|[1-9][0-9]*)(\.[0-9]+)?i\b/)) {
			label = parseFloat(label);
			return token = 'complex';
		} else if (match(/^(0|[1-9][0-9]*)\.[0-9]+\b/)) {
			label = parseFloat(label);
			return token = 'float';
		} else if (match(/^(0|[1-9][0-9]*)\b/)) {
			label = parseInt(label);
			return token = 'integer';
		} else if (match(/^\"([^"\\]|\\\\|\\["bfnrtv])*\"/)) {
			label = label
				.replace(/^\"|\"$/g, '')
				.replace(/\\\\/g, '\\')
				.replace(/\\\"/g, '\"')
				.replace(/\\b/g, '\b')
				.replace(/\\f/g, '\f')
				.replace(/\\n/g, '\n')
				.replace(/\\r/g, '\r')
				.replace(/\\t/g, '\t')
				.replace(/\\v/g, '\v');
			return token = 'string';
		} else if (match(/^>>>/)) {
			return token = 'symbol';
		} else if (match(/^(<<|>>|\!\=|<\=|>\=|\*\*)/)) {
			return token = 'symbol';
		} else if (match(/^(<|>|\+|\-|\/|\%|\~|\&|\||\^)/)) {
			return token = 'symbol';
		} else if (match(/^\*/)) {
			return token = 'asterisk';
		} else if (match(/^\=/)) {
			return token = 'equal';
		} else if (/^$/.test(input)) {
			label = null;
			return token = 'end';
		} else {
			throw new LambdaSyntaxError();
		}
	}

	next();

	this.next = next;

	this.end = function () {
		return token === 'end';
	};

	this.token = function () {
		return token;
	};

	this.label = function () {
		return label;
	};
};
