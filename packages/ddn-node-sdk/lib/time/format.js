var slots = require('./slots.js');

function timeAgo(time) {
  var d = slots.beginEpochTime();
	var t = parseInt(d.getTime() / 1000);

	time = new Date((time + t) * 1000);

	var currentTime = new Date().getTime();
	var diffTime = (currentTime - time.getTime()) / 1000;

	if (diffTime < 60) {
    return Math.floor(diffTime) + ' sec ago';
	}
	if (Math.floor(diffTime / 60) <= 1) {
    return Math.floor(diffTime / 60) + ' min ago';
	}
	if ((diffTime / 60) < 60) {
    return Math.floor(diffTime / 60) + ' mins ago';
	}
	if (Math.floor(diffTime / 60 / 60) <= 1) {
    return Math.floor(diffTime / 60 / 60) + ' hour ago';
	}
	if ((diffTime / 60 / 60) < 24) {
    return Math.floor(diffTime / 60 / 60) + ' hours ago';
	}
	if (Math.floor(diffTime / 60 / 60 / 24) <= 1) {
    return Math.floor(diffTime / 60 / 60 / 24) + ' day ago';
	}
	if ((diffTime / 60 / 60 / 24) < 30) {
    return Math.floor(diffTime / 60 / 60 / 24) + ' days ago';
	}
	if (Math.floor(diffTime / 60 / 60 / 24 / 30) <= 1) {
    return Math.floor(diffTime / 60 / 60 / 24 / 30) + ' month ago';
	}
	if ((diffTime / 60 / 60 / 24 / 30) < 12) {
    return Math.floor(diffTime / 60 / 60 / 24 / 30) + ' months ago';
	}
	if (Math.floor((diffTime / 60 / 60 / 24 / 30 / 12)) <= 1) {
    return Math.floor(diffTime / 60 / 60 / 24 / 30 / 12) + ' year ago';
	}

	return Math.floor(diffTime / 60 / 60 / 24 / 30 / 12) + ' years ago';
}

function fullTimestamp(time) {
  var d = slots.beginEpochTime();
  var t = parseInt(d.getTime() / 1000);

  d = new Date((time + t) * 1000);
  var month = d.getMonth() + 1;

  if (month < 10) {
    month = "0" + month;
  }

  var day = d.getDate();

  if (day < 10) {
    day = "0" + day;
  }

  var h = d.getHours();
  var m = d.getMinutes();
  var s = d.getSeconds();

  if (h < 10) {
    h = "0" + h;
  }

  if (m < 10) {
    m = "0" + m;
  }

  if (s < 10) {
    s = "0" + s;
  }

  return d.getFullYear() + "/" + month + "/" + day + " " + h + ":" + m + ":" + s;
}

module.exports = {
  timeAgo: timeAgo,
  fullTimestamp: fullTimestamp
}