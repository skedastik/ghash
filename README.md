# ghash

ghash generates fuzzy hashes from images. That is, it generates similar hashes for perceptually similar images.

## Usage

ghash makes use of features from [sharp][sharp-url] requiring [libvips][libvips-url] v7.42.0+.

### Overview

Generate a 64-bit hash (Buffer) from a local file in the form of a Promise:

```javascript
ghash('path/to/image.jpg')
  .calculate()
  .then(function (hash) {
      console.log(hash.toString('hex'));
  });
```

Generate a hash from an image stored in a Buffer, using a callback:

```javascript
ghash(imageBuffer).calculate(function (err, hash) {
    if (!err) console.log(hash.toString('hex'));
});
```

Specify resolution and fuzziness:

```javascript
ghash('path/to/image.jpg')
  .resolution(4)
  .fuzziness(10)
  .calculate();
```

### Options

#### Resolution

Valid values are in the range [2-8], inclusive. ghash always generates a 64-bit Buffer, but depending on resolution, not all bits are utilized. The default resolution is 8, utilizing all 64 bits. Smaller resolutions increase fuzziness (see Supplemental).

#### Fuzziness

Valid values are in the range [0-255], inclusive. The default fuzziness value is 0. Increasing this value increases fuzziness (see Supplemental).

## Supplemental

### Why ghash?

* ghash is simple (see Internals).
* ghash works well for tiny images.
    - [pHash](http://www.phash.org/), which is fantastic, doesn't work well for tiny images in my experience. Even for 4x4-pixel images that are nearly perceptually identical, pHash generates vastly different hashes. Theoretically, ghash could synergize nicely with pHash.
* ghash's "fuzziness" can be tuned (see Hash Characteristics).
    - ~~For instance, similar input images can be reduced to _identical_ "archetypes" (potentially useful for similarity search space reduction~~). In its current form, ghash generates too few hash collisions to reliably "bucket" images into archetypal hashes. This makes it unsuitable for similarity search space reduction. See [this study][study-url] for details.
* ghash is fairly resilient to various attacks (see Resilience).

### Hash Characteristics

Following are the results of running ghash (via included hash_profile.js) against various attacks on an input image (see test/sample) at various resolution and fuzziness values.

Numbered columns indicate Hamming distance from the original image's hash value at respective resolutions (8, 4, 3).

```
fuzziness = 0

    Input                            8       4       3
    --------------------------------------------------
    orig                             0       0       0
    attacked-compressed              0       1       0
    attacked-color-curved            0       0       0
    attacked-grayscale               1       0       0
    attacked-contrast                1       1       0
    attacked-gamma                   1       1       0
    attacked-noise                   0       1       0
    attacked-gaussian-blur           1       1       0
    attacked-scaled                  1       1       0
    attacked-new-feature             2       2       0
    attacked-padded                  33      8       3
    attacked-sheared                 10      2       0
    attacked-crop-centered           17      10      2
    attacked-rotated                 27      7       2
    control                          38      13      6

fuzziness = 5

    Input                            8       4       3
    --------------------------------------------------
    orig                             0       0       0
    attacked-compressed              0       0       0
    attacked-color-curved            2       1       0
    attacked-grayscale               0       0       0
    attacked-contrast                2       2       0
    attacked-gamma                   3       0       1
    attacked-noise                   0       1       0
    attacked-gaussian-blur           0       0       0
    attacked-scaled                  0       0       0
    attacked-new-feature             2       1       0
    attacked-padded                  34      8       3
    attacked-sheared                 12      1       0
    attacked-crop-centered           17      11      3
    attacked-rotated                 21      4       3
    control                          35      9       5

fuzziness = 10

    Input                            8       4       3
    --------------------------------------------------
    orig                             0       0       0
    attacked-compressed              0       0       0
    attacked-color-curved            2       0       0
    attacked-grayscale               1       0       0
    attacked-contrast                0       0       0
    attacked-gamma                   2       0       0
    attacked-noise                   0       0       0
    attacked-gaussian-blur           0       0       0
    attacked-scaled                  0       0       0
    attacked-new-feature             1       0       0
    attacked-padded                  29      6       3
    attacked-sheared                 7       1       0
    attacked-crop-centered           14      9       2
    attacked-rotated                 13      4       4
    control                          27      8       5
```

As you can see, _decreasing_ the `resolution` or _increasing_ the `fuzziness` value tends to generate more hash collisions--that is, Hamming distances of 0 (though not monotonically). This is important for eliminating false negatives in a similarity search, for instance.

#### Resilience

Going by the above results...

* ghash is resilient to the following attacks...
    - Compression
    - Color curving
    - Contrast/gamma adjustment
    - Noise
    - Gaussian blurring
    - Grayscale conversion
    - Scaling
* ghash has some resilience to...
    - Small feature changes
    - Slight shearing
* ghash has virtually no resilience to...
    - Padding
    - Cropping
    - Rotation

### Internals

ghash works in two stages.

#### 1. Image preprocessing

This involves two steps: conversion to grayscale, and down-scaling.

ghash converts to grayscale not only to simplify the algorithm, but because human sight relies almost entirely on luminance to recognize images.

Downscaling is necessary to compress the hash to 64 bits or less. The `resolution` value determines the final size of the downsized image.

#### 2. Hash calculation via luminance gradient

Now that ghash has a preprocessed image, it can begin calculating the hash value. It does so by calculating the difference in luminance between every pixel in the image and its immediate neighbor. If the neighboring pixel is "brighter" by some threshold (the `fuzziness` value), the corresponding bit in the output buffer is set to 1, otherwise 0.

By examining these "deltas", the algorithm is essentially performing edge-detection, the basis of image recognition. A higher `fuzziness` value equates to a higher edge-detection threshold.

### Caveats

* The above results are not scientific. The sample size used to explore ghash is too small to form serious conclusions. See [this study][study-url] for more comprehensive coverage.

* If ghash is used for search-space reduction, even a single false negative is bad. False positives are okay. This means you should tune aggressively for minimizing false negatives, even at the expense of increasing false positives. Elimination of all false negatives cannot be guaranteed. :(

* Because ghash uses [sharp][sharp-url]/[libvips][libvips-url] to preprocess images, changes to either library may result in tiny changes to the hashes produced.

* Because of ghash's simplicity, it has the potential to be lightning-fast. This implementation is slow. Ideally, ghash would be a native, multithreaded library.

[study-url]: https://github.com/skedastik/ghash-profile/blob/master/README.md
[sharp-url]: https://github.com/lovell/sharp
[libvips-url]: https://github.com/jcupitt/libvips