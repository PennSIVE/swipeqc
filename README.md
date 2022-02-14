# SwipeQC

Swipe cards to sort images pass / fail

## Setup

### Convert your NIFTIs to videos
[med2image](https://github.com/FNNDSC/med2image) can be used to convert NIFTI slices to JPEG, then imagick / ffmpeg can turn it into a video. In nifti2video, mimosa.sh will work on MIMoSA outputs and most pipelines should only require editing the `$flair` / `$seg` filename. On the cluster,
```sh
cd mimosa_outputs
mkdir ../mimosa_web
for subj_dir in $(ls); do
    bsub ./nifti2video/mimosa.sh $subj_dir ../mimosa_web
done
```

### Launch server, do QC
SwipeQC can be run from the cluster with the images if you do port forwarding. First, start SwipeQC from an available port on the cluster
```sh
cd ..
singularity pull docker://pennsive/swipeqc-api
export SINGULARITYENV_IMAGE_PATH=$PWD/mimosa_web
# assuming 5001 is an open port
singularity run --cleanenv --bind $PWD swipeqc-api_latest.sif --port=5001
```
Then in another Terminal window (on your local machine), forward the port you started the server on to a local port
```sh
ssh -qnNT -L 5001:127.0.0.1:5001 user@takim
```
And pull up http://localhost:5001 in your browser

3. Generate report
To list all the images sorted, run
```sh
echo "SELECT image, passed, at FROM ratings ORDER BY id ASC" | sqlite3 db.sqlite
```