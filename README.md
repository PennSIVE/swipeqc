# SwipeQC

Swipe cards to sort images pass / fail

## Setting up images
### Convert your NIFTIs to videos
NIFTI isn't a format natively understood by web browsers but [med2image](https://github.com/FNNDSC/med2image) can be used to convert NIFTI slices to JPEG, then imagick / ffmpeg can turn it into a video (and overlay a segmentation). In `setup`, `mimosa.sh` will work on MIMoSA outputs and most pipelines should only require editing the `$flair` / `$seg` filename. On the cluster,
```sh
singularity pull docker://pennsive/nifti2video
mkdir /path/to/mimosa_web # create output directory
dirs=$(find /path/to/mimosa_outputs -name "mimosa_binary_mask_0.25.nii.gz" | xargs dirname) # find sub/session dirs to process
for dir in $dirs; do
    outdir=/path/to/mimosa_web/${dir}
    mkdir -p $outdir
    qsub singularity run --cleanenv --bind $TMPDIR --bind /path/to/mimosa_web --bind /path/to/mimosa_outputs nifti2video_latest.sif $dir $outdir
done
```

## Using app
### Launch server
SwipeQC can be run from the cluster with the images if you do port forwarding. First, start SwipeQC from an available port on the cluster
```sh
cd ..
singularity pull docker://pennsive/swipeqc-api
export SINGULARITYENV_IMAGE_PATH=/path/to/mimosa_web
# assuming 5001 is an open port
singularity run --cleanenv --bind /path/to/mimosa_web swipeqc-api_latest.sif --port=5001 # this command starts the server; it is meant to hang
```
Then in another Terminal window (on your local machine), forward the port you started the server on to a local port
```sh
ssh -qnNT -L 5001:127.0.0.1:5001 user@takim
```
And pull up http://localhost:5001 in your browser

### Generate report
To list all the images sorted, run
```sh
echo "SELECT image, passed, at FROM ratings ORDER BY id ASC" | sqlite3 db.sqlite
```