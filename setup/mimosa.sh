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
mimosa_gif=$tmpdir/mimosa.gif
flair_gif=$tmpdir/flair.gif
# mimosa_mp4=$outdir/mimosa.mp4
# flair_mp4=$outdir/flair.mp4
mimosa_webm=$outdir/mimosa.webm
flair_webm=$outdir/flair.webm
convert -delay 0 -loop 0 $overlay_jpg/* $mimosa_gif
convert -delay 0 -loop 0 $flair_jpg/* $flair_gif

# convert gif to mp4 (smaller file size)
# ffmpeg -i $mimosa_gif -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p $mimosa_mp4
# ffmpeg -i $flair_gif -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p $flair_mp4
# convert gif to webm (even smaller file size)
ffmpeg -i $mimosa_gif -c vp9 -b:v 0 -crf 41 $mimosa_webm
ffmpeg -i $flair_gif -c vp9 -b:v 0 -crf 41 $flair_webm

rm -rf $tmpdir
