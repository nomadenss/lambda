function UndefinedValue() {}

exports.UndefinedValue = UndefinedValue;

UndefinedValue.prototype.context = Context.EMPTY;

UndefinedValue.prototype.clone = function (context) {
  var value = new UndefinedValue();
  value.context = context;
  return value;
};

UndefinedValue.DEFAULT = new UndefinedValue();

UndefinedValue.fromContext = function (context) {
  return UndefinedValue.DEFAULT.clone(context);
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

ComplexValue.prototype.clone = function (context) {
  var value = new ComplexValue(this.real, this.imaginary);
  value.context = context;
  return value;
};


function RealValue(value) {
  value = +value;
  ComplexValue.call(this, value, 0);
  this.value = value;
}

exports.RealValue = RealValue;
extend(ComplexValue, RealValue);

RealValue.prototype.clone = function (context) {
  var value = new RealValue(this.value);
  value.context = context;
  return value;
};


function IntegerValue(value) {
  RealValue.call(this, ~~value);
}

exports.IntegerValue = IntegerValue;
extend(RealValue, IntegerValue);

IntegerValue.prototype.clone = function (context) {
  var value = new IntegerValue(this.value);
  value.context = context;
  return value;
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

NaturalValue.prototype.clone = function (context) {
  var value = new NaturalValue(this.value);
  value.context = context;
  return value;
};


function BooleanValue(value) {
  value = !!value;
  UndefinedValue.call(this);
}

exports.BooleanValue = BooleanValue;
extend(UndefinedValue, BooleanValue);

BooleanValue.prototype.clone = function (context) {
  var value = new BooleanValue(this.value);
  value.context = context;
  return value;
};


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

StringValue.prototype.clone = function (context) {
  var value = new StringValue(this.value);
  value.context = context;
  return value;
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

ListValue.prototype.clone = function (context) {
  var value = new ListValue(this.values);
  value.context = context;
  return value;
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

Closure.prototype.clone = function (context) {
  var value = new Closure(this.lambda, this.capture);
  value.context = context;
  return value;
};
