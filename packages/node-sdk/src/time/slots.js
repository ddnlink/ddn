import options from '../options';
import constants from '../constants';

function getEpochTime(time) {
	if (time === undefined) {
		time = (new Date()).getTime();
	}
	const d = beginEpochTime();
	const t = d.getTime();
	return Math.floor((time - t) / 1000);
}

function beginEpochTime() {
	// return options.get('nethash') == 'b11fa2f2' ? new Date(Date.UTC(2017, 11, 20, 4, 0, 0, 0)) : new Date(Date.UTC(2017, 10, 20, 12, 20, 20, 20));
	return constants.nethash[options.get('nethash')].beginDate;
}

const interval = 10;
const delegates = 101;

function getTime(time) {
	return getEpochTime(time);
}

function getRealTime(epochTime) {
	if (epochTime === undefined) {
		epochTime = getTime()
	}
	const d = beginEpochTime();
	const t = Math.floor(d.getTime() / 1000) * 1000;
	return t + epochTime * 1000;
}

function getSlotNumber(epochTime) {
	if (epochTime === undefined) {
		epochTime = getTime()
	}

	return Math.floor(epochTime / interval);
}

function getSlotTime(slot) {
	return slot * interval;
}

function getNextSlot() {
	const slot = getSlotNumber();

	return slot + 1;
}

function getLastSlot(nextSlot) {
	return nextSlot + delegates;
}

export default {
	interval,
	delegates,
	getTime,
	getRealTime,
	getSlotNumber,
	getSlotTime,
	getNextSlot,
	getLastSlot,
	beginEpochTime
};
