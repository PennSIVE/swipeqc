#!/bin/bash

set -e

# check arguments
if [ $# -eq 1 ]; then
    outdir=$PWD
elif [ $# -eq 2 ]; then
    outdir=$2
else
    echo "Usage: $0 <nifti dir> [<output directory>]"
fi

cd $1
flair=flair_ws.nii.gz
seg=mimosa_binary_mask_0.25.nii.gz
tmpdir=$(mktemp -d)
flair_jpg=$tmpdir/flair_jpg
seg_jpg=$tmpdir/seg_jpg
overlay_jpg=$tmpdir/overlay_jpg
mkdir $flair_jpg $seg_jpg $overlay_jpg

# convert nifti to jpg
med2image -i ${flair} -d $flair_jpg > /dev/null 2>&1
med2image -i ${seg} -d $seg_jpg > /dev/null 2>&1

# the first 100 slices are pretty much black
rm $flair_jpg/output-slice0*
rm $seg_jpg/output-slice0*
# so are the final 50 slices
rm $flair_jpg/output-slice2*
rm $seg_jpg/output-slice2*

for i in $(seq 100 $(expr 100 + $(ls $flair_jpg | wc -l) - 1)); do
    i_pad=$(printf "%03d" $i)
    # make black transparent
    convert $seg_jpg/output-slice${i_pad}.jpg -fuzz 80% -transparent black $seg_jpg/output-slice${i_pad}.png
    # make white red
    convert $seg_jpg/output-slice${i_pad}.png -colorspace gray -fill red -colorize 100 $seg_jpg/output-slice${i_pad}.png
    # overlay segmentation on flair
    convert $flair_jpg/output-slice${i_pad}.jpg $seg_jpg/output-slice${i_pad}.png -gravity center -composite $overlay_jpg/$i.png
done

# convert jpg slices to gif
gif=$tmpdir/mimosa.gif
mp4=$outdir/mimosa.mp4
webm=$outdir/mimosa.webm
convert -delay 0 -loop 0 $overlay_jpg/*.png $gif

# convert gif to mp4 (smaller file size)
ffmpeg -i $gif -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p $mp4
# convert gif to webm (even smaller file size)
ffmpeg -i $gif -c vp9 -b:v 0 -crf 41 $webm

rm -rf $tmpdir
