var TransactionTypes = require("../helpers/transaction-types.js");

var private = {}, self = null,
	library = null, modules = null;

function ExampleContract(cb, _library) {
	self = this;
	library = _library;
	cb(null, self);
}

ExampleContract.prototype.create = function (data, trs) {
	return trs;
}

ExampleContract.prototype.calculateFee = function (trs) {
	return 0;
}

ExampleContract.prototype.verify = function (trs, sender, cb, scope) {
	setImmediate(cb, null, trs);
}

ExampleContract.prototype.getBytes = function (trs) {
	return null;
}

ExampleContract.prototype.apply = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

ExampleContract.prototype.undo = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

ExampleContract.prototype.applyUnconfirmed = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

ExampleContract.prototype.undoUnconfirmed = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

ExampleContract.prototype.ready = function (trs, sender, cb, scope) {
	setImmediate(cb);
}

ExampleContract.prototype.save = function (trs, cb) {
	setImmediate(cb);
}

ExampleContract.prototype.dbRead = function (row) {
	return null;
}

ExampleContract.prototype.normalize = function (asset, cb) {
	setImmediate(cb);
}

ExampleContract.prototype.onBind = function (_modules) {
	modules = _modules;
	modules.logic.transaction.attachAssetType(__TYPE__, self);
}

module.exports = ExampleContract;
