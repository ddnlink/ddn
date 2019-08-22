#!/bin/bash

readonly INIT_DIR=$(readlink -m $(dirname $0))

function add_cron() {
	cnt=`cat /etc/crontab | grep 'ddn_monitor' | grep -v '#' | wc -l`
	if [ $cnt -eq 0 ];then
		echo "*/1 * * * * root $INIT_DIR/ddn_monitor.sh" >> /etc/crontab
		if [ $? -ne 0 ];then
			echo "Add ddn_monitor crontab err, please add it manually!" && exit 2
		fi
	fi
}

function main() {
	add_cron
	echo "Configure ddn_monitor crontab done."
}

main
