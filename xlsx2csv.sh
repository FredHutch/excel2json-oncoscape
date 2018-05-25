#!/bin/bash

# xlsx2csv GBM-LGG.xlsx -s 1 > sheet1.csv
file='GBM-LGG.xlsx'
# max= 20
for i in `seq 1 30`
do
    echo "$i"
    SECONDS=0
    xlsx2csv $file -s $i > sheet$i.csv
    lineNum=$(cat sheet$i.csv | wc -l)
    echo "lineNum: $lineNum"
    if [ "$lineNum" -eq 0 ]
    then
      rm sheet$i.csv
      echo "sheet$i.csv is removed. Forloop stopped."
      break
    fi
    duration=$SECONDS
    echo "$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed."
done


