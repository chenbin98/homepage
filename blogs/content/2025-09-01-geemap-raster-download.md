---
slug: 2025-09-01-geemap-raster-download
date: 2025-09-01
title: Downloading Global Raster Data from Google Earth Engine with Geemap
title_zh: 使用 Geemap 从 GEE 下载全球栅格数据
summary: A complete, restartable workflow for downloading large Google Earth Engine raster datasets by grid and mosaicking the resulting tiles.
summary_zh: 使用网格分块、断点续传与镶嵌流程下载大规模 Google Earth Engine 栅格数据。
category: Google Earth Engine
category_zh: Google Earth Engine
tags: [Google Earth Engine, geemap, download_ee_image, Remote Sensing, Raster Processing]
cover: image/blogs/2025-09-01-geemap-raster-download.png
source_post: 2025-9-1-geedownloadimages.qmd
---

# Downloading Global Raster Data from Google Earth Engine with Geemap

## Overview

This technical note provides a complete workflow for using the Python library `geemap` to download large raster datasets, including global products, from Google Earth Engine (GEE). It addresses common challenges such as GEE pixel limits and interrupted downloads, then mosaics the downloaded tiles into a complete dataset.

The workflow applies to most GEE raster datasets, such as MODIS and Landsat. Adapt it by changing the dataset ID, resolution, time range, and related parameters.

## Prerequisites

### Software and libraries

Install the following tools and libraries.

| Tool or library | Purpose | Installation |
| --- | --- | --- |
| **Python** | Core programming environment | Download from [python.org](https://python.org/) |
| **`geemap`** | GEE visualization and data downloading | `pip install geemap` |
| **`earthengine-api` (`ee`)** | GEE Python API | `pip install earthengine-api` |
| **`geopandas`** | Reads vector grid data for tiled downloads | `pip install geopandas` |
| **`rasterio`** | Raster processing and mosaicking | `pip install rasterio` |
| **GDAL** | Raster-processing backend with multithreading | Included with `rasterio` |

> **Note:** After installing `earthengine-api`, authenticate with `earthengine authenticate`.

### Data preparation

- **GEE raster dataset ID:** identify the target dataset ID in GEE.
  - Example NPP dataset: `MODIS/061/MOD17A3HGF`
  - Example Landsat 8 dataset: `LANDSAT/LC08/C02/T1_L2`
- **Global vector grid:** prepare a pre-segmented vector grid in GeoPackage (`.gpkg`) format.
  - Divide the global study area into smaller downloadable tiles.
  - Example: `WorldFishnet.gpkg`; grid size can be customized to the data resolution.

## Step 1: Initialize the Environment and Preview the Data

### Load libraries

```python
import ee
import geemap
import os
import geopandas as gpd
```

### Authenticate and initialize GEE

```python
# Authenticate with GEE (run once; skip if already authenticated)
# ee.Authenticate()

# Initialize the GEE API
ee.Initialize()
```

### Load and preprocess GEE data

#### Define core parameters

```python
# Customize these parameters for the target dataset
GEE_DATA_ID = "MODIS/061/MOD17A3HGF"  # Example: MODIS NPP dataset
BAND_NAME = "Npp"                       # Target band name
TIME_RANGE = ["2001-01-01", "2025-01-01"]  # Time range (start, end)
SCALING_FACTOR = 0.0001                 # Converts GEE values to physical values

# Visualization parameters
VIS_PARAMS = {
    "min": 0,
    "max": 3,
    "palette": [
        "ffffff", "ce7e45", "df923d", "f1b555", "fcd163",
        "99b718", "74a901", "66a000", "529400", "3e8601",
        "207401", "056201", "004c00", "023b01", "012e01",
        "011d01", "011301"
    ]  # Adjust for the value range of the selected dataset
}
```

#### Load and preprocess the data

```python
# Load the GEE image collection
image_collection = ee.ImageCollection(GEE_DATA_ID)\
    .filterDate(TIME_RANGE[0], TIME_RANGE[1])\
    .select(BAND_NAME)

# Define a function that applies the scaling factor
def apply_scaling(image):
    return image.multiply(SCALING_FACTOR)

# Apply scaling to the collection
scaled_collection = image_collection.map(apply_scaling)
```

### Preview the data in Geemap

```python
# Initialize the geemap interface
Map = geemap.Map(center=(40, 100), zoom=4)  # Centered on Eurasia

# Mosaic the collection into one image for preview; use median or mean for time series
preview_image = scaled_collection.median()

# Add the image to the map
Map.addLayer(preview_image, VIS_PARAMS, f"{GEE_DATA_ID.split('/')[-1]}_Preview")

# Add a color-bar legend
Map.add_colorbar_branca(
    colors=VIS_PARAMS["palette"],
    vmin=VIS_PARAMS["min"],
    vmax=VIS_PARAMS["max"],
    label=BAND_NAME,
    position="bottomright"
)

# Display the map; run in Jupyter Notebook or Lab for an interactive view
Map
```

## Step 2: Tiled Downloading with Resume Support

Directly downloading global high-resolution data, for example at 500 m, can exceed GEE pixel limits. Use a vector grid to split the data into downloadable tiles. The following workflow skips files that already exist, so a later run can resume an interrupted download.

### Define download parameters

```python
# File paths; customize these values
GRID_PATH = "I:/geemap/roi/WorldFishnet.gpkg"  # Vector grid path
GRID_LAYER = "WorldFish30"                       # Layer name in the GeoPackage
OUTPUT_DIR = "I:/geemap/GEE_Global_Data/"        # Directory for downloaded tiles
RESOLUTION = 500                                  # Dataset resolution in metres
BATCH_SIZE = 5                                    # Number of grid tiles per batch
START_YEAR = 2001                                 # Resume from this year after interruption
START_GRID_INDEX = 0                              # Resume from this grid index after interruption
CRS = "EPSG:4326"                                # Target coordinate reference system (WGS84)
```

### Load the vector grid and create an output directory

```python
# Load the vector grid with geopandas
grid_gdf = gpd.read_file(GRID_PATH, layer=GRID_LAYER)

# Convert the GeoDataFrame to a GEE FeatureCollection
grid_ee = geemap.gdf_to_ee(grid_gdf)

# Create the output directory if needed
os.makedirs(OUTPUT_DIR, exist_ok=True)
```

### Download batches with resume support

```python
# Obtain the list of years from the time range
years = range(int(TIME_RANGE[0].split("-")[0]), int(TIME_RANGE[1].split("-")[0]))

# Iterate through years
for year in years:
    # Skip years before the resume point
    if year < START_YEAR:
        continue
    print(f"Processing data for {year}...")

    # Extract annual data
    annual_image = scaled_collection\
        .filter(ee.Filter.calendarRange(year, year, "year"))\
        .median()

    # Get the total number of grid tiles
    total_grids = grid_ee.size().getInfo()

    # Calculate the number of batches
    num_batches = (total_grids - START_GRID_INDEX + BATCH_SIZE - 1) // BATCH_SIZE

    # Process each batch
    for batch in range(num_batches):
        batch_start = START_GRID_INDEX + batch * BATCH_SIZE
        batch_end = min(batch_start + BATCH_SIZE, total_grids)
        current_batch = grid_ee.toList(BATCH_SIZE, batch_start)

        # Process each grid tile in the batch
        for i in range(batch_end - batch_start):
            # Obtain the current feature and its geometry
            grid_feature = ee.Feature(current_batch.get(i))
            grid_geom = grid_feature.geometry()

            # Create a unique output filename
            grid_index = batch_start + i + 1
            filename = f"{BAND_NAME}_{year}_grid_{grid_index:04d}.tif"
            file_path = os.path.join(OUTPUT_DIR, filename)

            # Skip an existing file to support resume behavior
            if os.path.exists(file_path):
                print(f"Skipping existing file: {filename}")
                continue

            # Download the clipped image
            try:
                # Clip the annual image to the current grid tile
                clipped_image = annual_image.clip(grid_geom)

                # Download with geemap
                geemap.download_ee_image(
                    image=clipped_image,
                    filename=file_path,
                    scale=RESOLUTION,
                    region=grid_geom,
                    crs=CRS,
                    max_tile_size=1024  # Adjust for available memory
                )
                print(f"Downloaded successfully: {filename}")

            except Exception as e:
                print(f"Download failed for {filename}: {str(e)}")
                continue

    # Reset the grid index for the next year
    START_GRID_INDEX = 0

print("All download tasks completed.")
```

## Step 3: Mosaic the Downloaded Tiles

Use `rasterio` and GDAL multithreading to mosaic tiles into one complete raster for each year.

### Define mosaic parameters

```python
# File paths; customize these values
INPUT_DIR = OUTPUT_DIR                    # Same directory used for downloaded tiles
MOSAIC_OUTPUT_DIR = "I:/geemap/GEE_Global_Data/Mosaicked/"  # Directory for mosaics
COMPRESSION = "LZW"                       # Compression method to reduce file size
```

### Enable GDAL multithreading

```python
# Enable GDAL multithreading to accelerate mosaicking
os.environ["GDAL_NUM_THREADS"] = "ALL_CPUS"  # Use all available CPUs
```

### Mosaic annual files

```python
import re
from rasterio.merge import merge
from rasterio.enums import Resampling

# Create the mosaic output directory
os.makedirs(MOSAIC_OUTPUT_DIR, exist_ok=True)

# Group tiled files by year
file_pattern = re.compile(rf"{BAND_NAME}_(\d{{4}})_grid_\d{{4}}\.tif$")
yearly_files = {}

for filename in os.listdir(INPUT_DIR):
    match = file_pattern.match(filename)
    if match:
        year = match.group(1)
        file_path = os.path.join(INPUT_DIR, filename)
        yearly_files.setdefault(year, []).append(file_path)

# Mosaic files for each year
for year, file_list in yearly_files.items():
    print(f"Mosaicking {len(file_list)} files for {year}...")
    datasets = []

    try:
        # Open all tiled files
        for file_path in file_list:
            src = rasterio.open(file_path)
            datasets.append(src)

        # Perform the mosaic
        mosaic_array, out_transform = merge(
            datasets,
            resampling=Resampling.nearest  # Use nearest-neighbour resampling for discrete data
        )

        # Update mosaic metadata
        out_meta = datasets[0].meta.copy()
        out_meta.update({
            "driver": "GTiff",
            "height": mosaic_array.shape[1],
            "width": mosaic_array.shape[2],
            "transform": out_transform,
            "compress": COMPRESSION,
            "bigtiff": "YES"  # Enable for large files greater than 4 GB
        })

        # Save the mosaic
        output_path = os.path.join(MOSAIC_OUTPUT_DIR, f"{BAND_NAME}_{year}_Global.tif")
        with rasterio.open(output_path, "w", **out_meta) as dest:
            dest.write(mosaic_array)

        print(f"Mosaic created successfully: {output_path}")

    except Exception as e:
        print(f"Mosaic failed for {year}: {str(e)}")
        continue

    finally:
        # Close all open raster datasets to release memory
        for ds in datasets:
            ds.close()

print("All mosaicking tasks completed.")
```

## Notes and Troubleshooting

### Common issues

| Problem | Solution |
| --- | --- |
| **GEE authentication error** | Run `ee.Authenticate()` again and follow the browser authentication prompts. |
| **Interrupted download** | The workflow skips existing files, so run the download script again to resume. |
| **Memory overload** | Reduce `BATCH_SIZE`, for example from 5 to 3, or reduce `max_tile_size`, for example from 1024 to 512. |
| **Mosaic failure** | Confirm that all tiles use the same CRS and resolution. |

### Customization tips

- **Non-annual data:** modify the time filter for monthly or seasonal data.

  ```python
  # Example: summer data
  ee.Filter.calendarRange(year, year, "year")\
    .filter(ee.Filter.calendarRange(6, 8, "month"))
  ```

- **Different datasets:** update `GEE_DATA_ID`, `BAND_NAME`, `SCALING_FACTOR`, and `VIS_PARAMS`.
- **Grid adjustment:** use coarser or finer grids according to the data resolution, for example 10° × 10° or 5° × 5°.

## References

- **`geemap` documentation:** [geemap.org](https://geemap.org/)
- **GEE Python API documentation:** [developers.google.com/earth-engine](https://developers.google.com/earth-engine/guides/python_install)
- **`rasterio` mosaic guide:** [rasterio.readthedocs.io](https://rasterio.readthedocs.io/en/latest/topics/merge.html)
- **MODIS MOD17A3HGF dataset:** [GEE MOD17A3HGF documentation](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD17A3HGF)

> This workflow is suitable for most GEE raster datasets and can be adjusted and optimized for a specific use case.
