function AbstractValue() {}

exports.AbstractValue = AbstractValue;

AbstractValue.prototype.is = function (Class) {
  return this instanceof Class;
};

AbstractValue.prototype.bindThis = function () {
  return this;
};


function UndefinedValue() {
  AbstractValue.call(this);
}

exports.UndefinedValue = UndefinedValue;
extend(AbstractValue, UndefinedValue);

UndefinedValue.prototype.context = Context.EMPTY;

UndefinedValue.prototype.toString = function () {
  return 'undefined';
};

UndefinedValue.prototype._clone = function () {
  return new UndefinedValue();
};

UndefinedValue.prototype.clone = function (context) {
  var value = this._clone();
  value.context = context;
  return value;
};

UndefinedValue.prototype.marshal = function () {
  return this.context.toObject();
};

UndefinedValue.DEFAULT = new UndefinedValue();

UndefinedValue.fromContext = function (context) {
  return UndefinedValue.DEFAULT.clone(context);
};


function NativeComplexValue(real, imaginary) {
  this.r = +real;
  this.i = +imaginary;
}

exports.NativeComplexValue = NativeComplexValue;

NativeComplexValue.prototype.toString = function () {
  if (this.i < 0) {
    return this.r + '' + this.i + 'i';
  } else {
    return this.r + '+' + this.i + 'i';
  }
};


function ComplexValue(real, imaginary) {
  real = +real;
  imaginary = +imaginary;
  UndefinedValue.call(this);
  this.real = real;
  this.imaginary = imaginary;
}

exports.ComplexValue = ComplexValue;
extend(UndefinedValue, ComplexValue);

ComplexValue.prototype.toString = function () {
  if (this.imaginary < 0) {
    return this.real + '' + this.imaginary + 'i';
  } else {
    return this.real + '+' + this.imaginary + 'i';
  }
};

ComplexValue.prototype._clone = function () {
  return new ComplexValue(this.real, this.imaginary);
};

ComplexValue.prototype.marshal = function () {
  return new NativeComplexValue(this.real, this.imaginary);
};


function RealValue(value) {
  value = +value;
  ComplexValue.call(this, value, 0);
  this.value = value;
}

exports.RealValue = RealValue;
extend(ComplexValue, RealValue);

RealValue.prototype.toString = function () {
  return '' + this.value;
};

RealValue.prototype._clone = function () {
  return new RealValue(this.value);
};

RealValue.prototype.marshal = function () {
  return this.value;
};


function IntegerValue(value) {
  RealValue.call(this, ~~value);
}

exports.IntegerValue = IntegerValue;
extend(RealValue, IntegerValue);

IntegerValue.prototype.toString = function () {
  return '' + this.value;
};

IntegerValue.prototype._clone = function () {
  return new IntegerValue(this.value);
};

IntegerValue.prototype.marshal = function () {
  return this.value;
};


function NaturalValue(value) {
  value = ~~value;
  if (value < 0) {
    throw new LambdaInternalError();
  }
  IntegerValue.call(this, value);
}

exports.NaturalValue = NaturalValue;
extend(IntegerValue, NaturalValue);

NaturalValue.prototype.toString = function () {
  return '' + this.value;
};

NaturalValue.prototype._clone = function () {
  return new NaturalValue(this.value);
};

NaturalValue.prototype.marshal = function () {
  return this.value;
};


function BooleanValue(value) {
  value = !!value;
  UndefinedValue.call(this);
  this.value = value;
}

exports.BooleanValue = BooleanValue;
extend(UndefinedValue, BooleanValue);

BooleanValue.prototype.toString = function () {
  if (this.value) {
    return 'true';
  } else {
    return 'false';
  }
};

BooleanValue.prototype._clone = function () {
  return new BooleanValue(this.value);
};

BooleanValue.prototype.marshal = function () {
  return this.value;
};

BooleanValue.TRUE = new BooleanValue(true);
BooleanValue.FALSE = new BooleanValue(false);


function IndexedValue() {
  UndefinedValue.call(this);
}

exports.IndexedValue = IndexedValue;
extend(UndefinedValue, IndexedValue);


function StringValue(value) {
  value = '' + value;
  IndexedValue.call(this);
  this.value = value;
}

exports.StringValue = StringValue;
extend(IndexedValue, StringValue);

StringValue.prototype.toString = function () {
  return this.value;
};

StringValue.prototype._clone = function () {
  return new StringValue(this.value);
};

StringValue.prototype.marshal = function () {
  return this.value;
};

StringValue.prototype.lookup = function (index) {
  if (index < 0 || index >= this.value.length) {
    throw new LambdaRuntimeError();
  }
  return new StringValue(this.value[index]);
};


function ListValue(values) {
  IndexedValue.call(this);
  this.values = values;
}

exports.ListValue = ListValue;
extend(IndexedValue, ListValue);

ListValue.prototype.toString = function () {
  return '{ ' + this.values.map(function (value) {
    return value.toString();
  }).join(', ') + ' }';
};

ListValue.prototype._clone = function () {
  return new ListValue(this.values);
};

ListValue.prototype.marshal = function () {
  return this.values.map(function (value) {
    return value.marshal();
  });
};

ListValue.prototype.lookup = function (index) {
  if (index < 0 || index >= this.values.length) {
    throw new LambdaRuntimeError();
  }
  return this.values[index];
};


function Closure(lambda, capture) {
  UndefinedValue.call(this);
  this.lambda = lambda;
  this.capture = capture;
}

exports.Closure = Closure;
extend(UndefinedValue, Closure);

Closure.prototype.toString = function () {
  return 'closure';
};

Closure.prototype._clone = function () {
  return new Closure(this.lambda, this.capture);
};

Closure.prototype.getLength = function () {
  var length = 0;
  for (var node = this.lambda; node.is(LambdaNode); node = node.body) {
    length++;
  }
  return length;
};

Closure.prototype.bindThis = function (value) {
  return this.lambda.body.evaluate(this.capture.add(this.lambda.name, value));
};

Closure.prototype.marshal = function () {
  var node = this.lambda;
  var context = this.capture;
  var length = this.getLength();
  var hasThis = 'this' === this.lambda.name;
  return arity(length - !hasThis, function () {
    var values = [].slice.call(arguments);
    if (hasThis) {
      values.unshift(this);
    }
    return (function augment(node, context, index) {
      if (index < length) {
        return augment(node.body, context.add(node.name, AbstractValue.unmarshal(values[index])), index + 1);
      } else {
        return (function () {
          try {
            return node.evaluate(context);
          } catch (error) {
            if (error instanceof LambdaUserError) {
              throw error.value.marshal();
            } else {
              throw error;
            }
          }
        }()).marshal();
      }
    }(node, context, 0));
  });
};

Closure.fromFunction = function (nativeFunction) {
  return new Closure((function makeLambda(index, names) {
    if (index < nativeFunction.length + 1) {
      var name = '' + index;
      names.push(name);
      return new LambdaNode(name, UndefinedType.DEFAULT, makeLambda(index + 1, names));
    } else {
      return new NativeNode(nativeFunction, names);
    }
  }(0, [])), Context.EMPTY);
};

Closure.unmarshal = function () {
  // TODO
};


function JSUndefinedValue() {
  AbstractValue.call(this);
}

exports.JSUndefinedValue = JSUndefinedValue;
extend(AbstractValue, JSUndefinedValue);

JSUndefinedValue.prototype.toString = function () {
  return 'JavaScript.UNDEFINED';
};

JSUndefinedValue.prototype.marshal = function () {};

JSUndefinedValue.INSTANCE = new JSUndefinedValue();


function JSNullValue() {
  AbstractValue.call(this);
}

exports.JSNullValue = JSNullValue;
extend(AbstractValue, JSNullValue);

JSNullValue.prototype.toString = function () {
  return 'JavaScript.NULL';
};

JSNullValue.prototype.marshal = function () {
  return null;
};

JSNullValue.INSTANCE = new JSNullValue();


AbstractValue.unmarshal = function (value) {
  switch (typeof value) {
  case 'undefined':
    return JSUndefinedValue.INSTANCE;
  case 'boolean':
    return new BooleanValue(value);
  case 'number':
    if (value % 1) {
      return new RealValue(value);
    } else if (value < 0) {
      return new IntegerValue(~~value);
    } else {
      return new NaturalValue(~~value);
    }
  case 'string':
    return new StringValue(value);
  case 'function':
    return Closure.unmarshal(value);
  case 'object':
    if (null === value) {
      return JSNullValue.INSTANCE;
    } else if (value instanceof Boolean || value instanceof Number || value instanceof String) {
      return AbstractValue.unmarshal(value.valueOf());
    } else if (Array.isArray(value)) {
      return new NativeArrayValue(value);
    } else if (value instanceof NativeComplexValue) {
      return new ComplexValue(value.r, value.i);
    } else {
      return UndefinedValue.fromContext(new NativeContext(value));
    }
  default:
    throw new LambdaInternalError();
  }
};

AbstractValue.getGlobal = function (name) {
  return AbstractValue.unmarshal(getGlobalValue(name));
};
