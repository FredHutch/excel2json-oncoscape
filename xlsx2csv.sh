#!/bin/bash

# xlsx2csv GBM-LGG.xlsx -s 1 > sheet1.csv

max= 20
for i in `seq 1 $max`
do
    echo "$i"
    SECONDS=0
    xlsx2csv GBM-LGG.xlsx -s $i > sheet$i.csv
    duration=$SECONDS
    echo "$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed."
done


