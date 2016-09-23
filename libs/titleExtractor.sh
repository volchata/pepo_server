#!/bin/bash

DST=`mktemp`;

wget -qO "$DST" "$1";

CL=`cat "$DST" |sed -rn 's/.*<meta[^>]+charset=(["]?)([a-z0-9_-]+)(["]?).*/\2/pi;'|head -n1`;

# echo -e "\n\n $CL \n\n"
cat "$DST"|iconv -cf "$CL"|awk 'BEGIN{IGNORECASE=1;FS="<title>|</title>";RS=EOF} {print $2}' |tr -d '\r\n'

rm -f "$DST";