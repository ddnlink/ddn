#!/bin/bash
readonly PROG_DIR=$(readlink -m $(dirname $0))
ddnd=$PROG_DIR/../ddnd
log=$PROG_DIR/../logs/ddn_monitor.log

function auto_restart(){
	status=`$ddnd status`
	if [ "$status" == "DDN server is not running" ];then
		$ddnd restart
		echo "`date +%F' '%H:%M:%S`[error]	DDN server is not running and restarted" >> $log
	else
		echo "`date +%F' '%H:%M:%S`[info]	DDN server is running" >> $log
	fi	
	/etc/init.d/ntp stop
	sleep 2
	ntpdate pool.ntp.org >> $log
	/etc/init.d/ntp start
}

auto_restart
